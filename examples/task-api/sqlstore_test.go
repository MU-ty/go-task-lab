package taskapi

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"
)

// 只在明确配置的专用测试数据库中创建临时 schema，不清理其他 schema。
func sqlTestStore(t *testing.T) (*SQLStore, string) {
	t.Helper()
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_DATABASE_URL missing: PostgreSQL integration test not run")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	admin, err := OpenPostgres(ctx, dsn)
	if err != nil {
		t.Fatal(err)
	}
	token, err := randomToken()
	if err != nil {
		t.Fatal(err)
	}
	schema := "go_lab_test_" + strings.ToLower(strings.ReplaceAll(strings.ReplaceAll(token[:12], "-", "a"), "_", "b"))
	if _, err = admin.DB.ExecContext(ctx, `CREATE SCHEMA "`+schema+`"`); err != nil {
		admin.DB.Close()
		t.Fatal(err)
	}
	t.Cleanup(func() {
		defer admin.DB.Close()
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if !strings.HasPrefix(schema, "go_lab_test_") {
			t.Error("unsafe schema cleanup")
			return
		}
		if _, err := admin.DB.ExecContext(ctx, `DROP SCHEMA "`+schema+`" CASCADE`); err != nil {
			t.Error(err)
		}
	})
	u, err := url.Parse(dsn)
	if err != nil {
		t.Fatal(err)
	}
	q := u.Query()
	q.Set("search_path", schema)
	u.RawQuery = q.Encode()
	isolated := u.String()
	s, err := OpenPostgres(ctx, isolated)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { s.DB.Close() })
	if err = Migrate(ctx, s.DB); err != nil {
		t.Fatal(err)
	}
	return s, isolated
}
func TestSQLAPIContract(t *testing.T) { s, _ := sqlTestStore(t); testCRUDContract(t, s) }
func TestSQLRegistrationLoginLogout(t *testing.T) {
	s, _ := sqlTestStore(t)
	testRegistrationLoginLogout(t, s)
}
func TestSQLPersistenceConstraintsAndRollback(t *testing.T) {
	s, dsn := sqlTestStore(t)
	ctx := context.Background()
	if err := Migrate(ctx, s.DB); err != nil {
		t.Fatal("repeat migration:", err)
	}
	u, err := s.CreateUser(ctx, "sql@example.test", "test-only-hash")
	if err != nil {
		t.Fatal(err)
	}
	if _, err = s.CreateUser(ctx, u.Email, "other"); !errors.Is(err, ErrConflict) {
		t.Fatalf("unique constraint: %v", err)
	}
	task, err := s.CreateTask(ctx, u.ID, "quoted ' title")
	if err != nil {
		t.Fatal(err)
	}
	other, err := OpenPostgres(ctx, dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer other.DB.Close()
	loaded, err := other.GetTask(ctx, u.ID, task.ID)
	if err != nil || loaded.Title != task.Title {
		t.Fatal("persistence/parameterization failure")
	}
	if _, err = s.CreateTask(ctx, 999999, "invalid owner"); err == nil {
		t.Fatal("missing foreign key")
	}
	if _, err = s.CreateTask(ctx, u.ID, ""); err == nil {
		t.Fatal("missing title constraint")
	}
	before, err := s.ListTasks(ctx, u.ID, 100, 0)
	if err != nil {
		t.Fatal(err)
	}
	if _, err = s.DB.ExecContext(ctx, "ALTER TABLE audit_events ADD CONSTRAINT test_reject_audit CHECK (action <> 'task.created') NOT VALID"); err != nil {
		t.Fatal(err)
	}
	if _, err = s.CreateTask(ctx, u.ID, "must roll back"); err == nil {
		t.Fatal("expected audit failure")
	}
	after, err := s.ListTasks(ctx, u.ID, 100, 0)
	if err != nil || len(after) != len(before) {
		t.Fatal("partial transaction remained")
	}
	if _, err = s.DB.ExecContext(ctx, "ALTER TABLE audit_events DROP CONSTRAINT test_reject_audit"); err != nil {
		t.Fatal(err)
	}
	var audits int
	if err = s.DB.QueryRowContext(ctx, "SELECT count(*) FROM audit_events WHERE owner_id=$1", u.ID).Scan(&audits); err != nil || audits != 1 {
		t.Fatalf("audit count=%d err=%v", audits, err)
	}
	expired := "expired-session-token"
	if err = s.CreateSession(ctx, tokenDigest(expired), u.ID, time.Now().Add(-time.Hour)); err != nil {
		t.Fatal(err)
	}
	if _, err = s.SessionUser(ctx, tokenDigest(expired), time.Now()); !errors.Is(err, ErrNotFound) {
		t.Fatal("expired session accepted")
	}
	if err = s.PruneSessions(ctx, time.Now()); err != nil {
		t.Fatal(err)
	}
	var sessionCount int
	s.DB.QueryRowContext(ctx, "SELECT count(*) FROM sessions").Scan(&sessionCount)
	if sessionCount != 0 {
		t.Fatal("session not pruned")
	}
	canceled, cancel := context.WithCancel(ctx)
	cancel()
	if _, err = s.ListTasks(canceled, u.ID, 20, 0); !errors.Is(err, context.Canceled) {
		t.Fatal("ignored canceled context:", err)
	}
	t.Log(fmt.Sprintf("migration, constraints, persistence, ownership, transaction rollback and cancellation verified for task %d", task.ID))
}
