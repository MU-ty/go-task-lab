package taskapi

import (
	"context"
	"database/sql"
	"embed"
)

//go:embed migrations/*.sql
var migrationFiles embed.FS

func Migrate(ctx context.Context, db *sql.DB) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	// 事务级 advisory lock 串行化多个迁移进程，释放随事务结束。
	if _, err = tx.ExecContext(ctx, "SELECT pg_advisory_xact_lock(74219001)"); err != nil {
		return err
	}
	if _, err = tx.ExecContext(ctx, "CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())"); err != nil {
		return err
	}
	var applied bool
	if err = tx.QueryRowContext(ctx, "SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version=1)").Scan(&applied); err != nil {
		return err
	}
	if !applied {
		data, err := migrationFiles.ReadFile("migrations/001_init.sql")
		if err != nil {
			return err
		}
		if _, err = tx.ExecContext(ctx, string(data)); err != nil {
			return err
		}
		if _, err = tx.ExecContext(ctx, "INSERT INTO schema_migrations(version) VALUES(1)"); err != nil {
			return err
		}
	}
	return tx.Commit()
}
