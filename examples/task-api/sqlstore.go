package taskapi

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
	_ "github.com/jackc/pgx/v5/stdlib"
)

type SQLStore struct{ DB *sql.DB }

func OpenPostgres(ctx context.Context, dsn string) (*SQLStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(30 * time.Minute)
	if err = db.PingContext(ctx); err != nil {
		db.Close()
		return nil, err
	}
	return &SQLStore{DB: db}, nil
}
func storageError(err error) error {
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	}
	var pg *pgconn.PgError
	if errors.As(err, &pg) && pg.Code == "23505" {
		return ErrConflict
	}
	return err
}
func (s *SQLStore) Ping(ctx context.Context) error {
	if err := s.DB.PingContext(ctx); err != nil {
		return err
	}
	var version int
	return s.DB.QueryRowContext(ctx, "SELECT version FROM schema_migrations WHERE version=1").Scan(&version)
}
func (s *SQLStore) CreateUser(ctx context.Context, email, hash string) (User, error) {
	u := User{Email: email, PasswordHash: hash}
	err := s.DB.QueryRowContext(ctx, "INSERT INTO users(email,password_hash) VALUES($1,$2) RETURNING id", email, hash).Scan(&u.ID)
	return u, storageError(err)
}
func (s *SQLStore) FindUser(ctx context.Context, email string) (User, error) {
	var u User
	err := s.DB.QueryRowContext(ctx, "SELECT id,email,password_hash FROM users WHERE email=$1", email).Scan(&u.ID, &u.Email, &u.PasswordHash)
	return u, storageError(err)
}
func (s *SQLStore) CreateSession(ctx context.Context, digest string, userID int64, expires time.Time) error {
	_, err := s.DB.ExecContext(ctx, "INSERT INTO sessions(digest,user_id,expires_at) VALUES($1,$2,$3)", digest, userID, expires)
	return storageError(err)
}
func (s *SQLStore) SessionUser(ctx context.Context, digest string, now time.Time) (int64, error) {
	var id int64
	err := s.DB.QueryRowContext(ctx, "SELECT user_id FROM sessions WHERE digest=$1 AND expires_at>$2", digest, now).Scan(&id)
	return id, storageError(err)
}
func (s *SQLStore) DeleteSession(ctx context.Context, digest string) error {
	_, err := s.DB.ExecContext(ctx, "DELETE FROM sessions WHERE digest=$1", digest)
	return err
}

type rowScanner interface{ Scan(...any) error }

func scanTask(row rowScanner) (Task, error) {
	var t Task
	err := row.Scan(&t.ID, &t.Title, &t.Done, &t.CreatedAt, &t.UpdatedAt)
	return t, storageError(err)
}

const taskColumns = "id,title,done,created_at,updated_at"

func (s *SQLStore) CreateTask(ctx context.Context, owner int64, title string) (Task, error) {
	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return Task{}, err
	}
	defer tx.Rollback()
	t, err := scanTask(tx.QueryRowContext(ctx, "INSERT INTO tasks(owner_id,title) VALUES($1,$2) RETURNING "+taskColumns, owner, title))
	if err != nil {
		return Task{}, err
	}
	if _, err = tx.ExecContext(ctx, "INSERT INTO audit_events(owner_id,task_id,action) VALUES($1,$2,'task.created')", owner, t.ID); err != nil {
		return Task{}, err
	}
	if err = tx.Commit(); err != nil {
		return Task{}, err
	}
	return t, nil
}
func (s *SQLStore) ListTasks(ctx context.Context, owner int64, limit, offset int) ([]Task, error) {
	rows, err := s.DB.QueryContext(ctx, "SELECT "+taskColumns+" FROM tasks WHERE owner_id=$1 ORDER BY id LIMIT $2 OFFSET $3", owner, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []Task{}
	for rows.Next() {
		t, err := scanTask(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, t)
	}
	return items, rows.Err()
}
func (s *SQLStore) GetTask(ctx context.Context, owner, id int64) (Task, error) {
	return scanTask(s.DB.QueryRowContext(ctx, "SELECT "+taskColumns+" FROM tasks WHERE owner_id=$1 AND id=$2", owner, id))
}
func (s *SQLStore) UpdateTask(ctx context.Context, owner, id int64, title *string, done *bool) (Task, error) {
	return scanTask(s.DB.QueryRowContext(ctx, "UPDATE tasks SET title=COALESCE($1,title),done=COALESCE($2,done),updated_at=now() WHERE owner_id=$3 AND id=$4 RETURNING "+taskColumns, title, done, owner, id))
}
func (s *SQLStore) DeleteTask(ctx context.Context, owner, id int64) error {
	result, err := s.DB.ExecContext(ctx, "DELETE FROM tasks WHERE owner_id=$1 AND id=$2", owner, id)
	if err != nil {
		return err
	}
	n, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}
func (s *SQLStore) PruneSessions(ctx context.Context, now time.Time) error {
	_, err := s.DB.ExecContext(ctx, "DELETE FROM sessions WHERE expires_at<=$1", now)
	return err
}

var _ Store = (*SQLStore)(nil)
