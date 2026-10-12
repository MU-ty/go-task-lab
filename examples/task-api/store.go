// Package taskapi 实现多用户任务服务，HTTP 层只依赖这里的小型仓储合同。
package taskapi

import (
	"context"
	"errors"
	"time"
)

var (
	ErrNotFound = errors.New("not found")
	ErrConflict = errors.New("conflict")
)

type User struct {
	ID           int64  `json:"id"`
	Email        string `json:"email"`
	PasswordHash string `json:"-"`
}

type Task struct {
	ID        int64     `json:"id"`
	Title     string    `json:"title"`
	Done      bool      `json:"done"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Store interface {
	Ping(context.Context) error
	CreateUser(ctx context.Context, email, passwordHash string) (User, error)
	FindUser(ctx context.Context, email string) (User, error)
	CreateSession(ctx context.Context, digest string, userID int64, expires time.Time) error
	SessionUser(ctx context.Context, digest string, now time.Time) (int64, error)
	DeleteSession(ctx context.Context, digest string) error
	CreateTask(ctx context.Context, owner int64, title string) (Task, error)
	ListTasks(ctx context.Context, owner int64, limit, offset int) ([]Task, error)
	GetTask(ctx context.Context, owner, id int64) (Task, error)
	UpdateTask(ctx context.Context, owner, id int64, title *string, done *bool) (Task, error)
	DeleteTask(ctx context.Context, owner, id int64) error
}
