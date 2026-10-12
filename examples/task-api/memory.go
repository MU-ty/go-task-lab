package taskapi

import (
	"context"
	"sort"
	"sync"
	"time"
)

type memorySession struct {
	user    int64
	expires time.Time
}
type ownedTask struct {
	owner int64
	task  Task
}
type MemoryStore struct {
	mu             sync.Mutex
	users          map[string]User
	sessions       map[string]memorySession
	tasks          map[int64]ownedTask
	nextUser, next int64
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{users: make(map[string]User), sessions: make(map[string]memorySession), tasks: make(map[int64]ownedTask)}
}
func (s *MemoryStore) Ping(ctx context.Context) error { return ctx.Err() }
func (s *MemoryStore) CreateUser(ctx context.Context, email, hash string) (User, error) {
	if err := ctx.Err(); err != nil {
		return User{}, err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.users[email]; ok {
		return User{}, ErrConflict
	}
	s.nextUser++
	u := User{ID: s.nextUser, Email: email, PasswordHash: hash}
	s.users[email] = u
	return u, nil
}
func (s *MemoryStore) FindUser(ctx context.Context, email string) (User, error) {
	if err := ctx.Err(); err != nil {
		return User{}, err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	u, ok := s.users[email]
	if !ok {
		return User{}, ErrNotFound
	}
	return u, nil
}
func (s *MemoryStore) CreateSession(ctx context.Context, digest string, user int64, expires time.Time) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	// 开发内存模式也清理过期会话，避免持续堆积。
	for key, session := range s.sessions {
		if !time.Now().Before(session.expires) {
			delete(s.sessions, key)
		}
	}
	s.sessions[digest] = memorySession{user, expires}
	return nil
}
func (s *MemoryStore) SessionUser(ctx context.Context, digest string, now time.Time) (int64, error) {
	if err := ctx.Err(); err != nil {
		return 0, err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	session, ok := s.sessions[digest]
	if !ok || !now.Before(session.expires) {
		delete(s.sessions, digest)
		return 0, ErrNotFound
	}
	return session.user, nil
}
func (s *MemoryStore) DeleteSession(ctx context.Context, digest string) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.sessions, digest)
	return nil
}
func (s *MemoryStore) CreateTask(ctx context.Context, owner int64, title string) (Task, error) {
	if err := ctx.Err(); err != nil {
		return Task{}, err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.next++
	now := time.Now().UTC()
	task := Task{ID: s.next, Title: title, CreatedAt: now, UpdatedAt: now}
	s.tasks[task.ID] = ownedTask{owner, task}
	return task, nil
}
func (s *MemoryStore) ListTasks(ctx context.Context, owner int64, limit, offset int) ([]Task, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	items := []Task{}
	for _, item := range s.tasks {
		if item.owner == owner {
			items = append(items, item.task)
		}
	}
	sort.Slice(items, func(i, j int) bool { return items[i].ID < items[j].ID })
	if offset >= len(items) {
		return []Task{}, nil
	}
	end := min(offset+limit, len(items))
	return items[offset:end], nil
}
func (s *MemoryStore) GetTask(ctx context.Context, owner, id int64) (Task, error) {
	if err := ctx.Err(); err != nil {
		return Task{}, err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	item, ok := s.tasks[id]
	if !ok || item.owner != owner {
		return Task{}, ErrNotFound
	}
	return item.task, nil
}
func (s *MemoryStore) UpdateTask(ctx context.Context, owner, id int64, title *string, done *bool) (Task, error) {
	if err := ctx.Err(); err != nil {
		return Task{}, err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	item, ok := s.tasks[id]
	if !ok || item.owner != owner {
		return Task{}, ErrNotFound
	}
	if title != nil {
		item.task.Title = *title
	}
	if done != nil {
		item.task.Done = *done
	}
	item.task.UpdatedAt = time.Now().UTC()
	s.tasks[id] = item
	return item.task, nil
}
func (s *MemoryStore) DeleteTask(ctx context.Context, owner, id int64) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	item, ok := s.tasks[id]
	if !ok || item.owner != owner {
		return ErrNotFound
	}
	delete(s.tasks, id)
	return nil
}

var _ Store = (*MemoryStore)(nil)
