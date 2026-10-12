package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"syscall"
	"time"

	taskapi "github.com/MU-ty/go-task-lab/examples/task-api"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	if err := run(logger); err != nil {
		logger.Error("service stopped", "error", err)
		os.Exit(1)
	}
}
func run(logger *slog.Logger) error {
	addr := os.Getenv("LISTEN_ADDR")
	if addr == "" {
		addr = "127.0.0.1:8090"
	}
	if _, _, err := net.SplitHostPort(addr); err != nil {
		return fmt.Errorf("invalid LISTEN_ADDR")
	}
	dsn := os.Getenv("DATABASE_URL")
	origin := os.Getenv("ALLOWED_ORIGIN")
	if origin == "" {
		origin = "http://127.0.0.1:8090"
	}
	parsed, err := url.Parse(origin)
	if err != nil || parsed.Host == "" || (parsed.Scheme != "https" && parsed.Scheme != "http") || parsed.Path != "" || parsed.RawQuery != "" || parsed.Fragment != "" || parsed.User != nil {
		return fmt.Errorf("ALLOWED_ORIGIN must be an exact http(s) origin")
	}
	if os.Getenv("APP_ENV") == "production" {
		if err := validateProduction(dsn, parsed.Scheme); err != nil {
			return err
		}
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	var store taskapi.Store = taskapi.NewMemoryStore()
	var postgres *taskapi.SQLStore
	if dsn != "" {
		connect, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()
		postgres, err = taskapi.OpenPostgres(connect, dsn)
		if err != nil {
			return fmt.Errorf("database connection unavailable")
		}
		defer postgres.DB.Close()
		store = postgres
	}
	if len(os.Args) > 1 {
		if os.Args[1] != "migrate" || len(os.Args) != 2 {
			return fmt.Errorf("usage: api [migrate]")
		}
		if postgres == nil {
			return fmt.Errorf("migrate requires DATABASE_URL")
		}
		migration, cancel := context.WithTimeout(ctx, 30*time.Second)
		defer cancel()
		if err = taskapi.Migrate(migration, postgres.DB); err != nil {
			return fmt.Errorf("database migration failed: %w", err)
		}
		logger.Info("migration complete")
		return nil
	}
	if postgres != nil {
		ready, cancel := context.WithTimeout(ctx, 3*time.Second)
		err := postgres.Ping(ready)
		cancel()
		if err != nil {
			return fmt.Errorf("database schema unavailable; run api migrate before starting")
		}
	}
	handler, err := taskapi.New(store, logger, taskapi.Options{AllowedOrigin: origin})
	if err != nil {
		return err
	}
	server := &http.Server{Addr: addr, Handler: handler, ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 15 * time.Second, IdleTimeout: 60 * time.Second, MaxHeaderBytes: 32 << 10}
	mode := "memory"
	if postgres != nil {
		mode = "postgres"
	}
	logger.Info("listening", "address", addr, "storage", mode)
	finished := make(chan error, 1)
	go func() { finished <- server.ListenAndServe() }()
	// 可退出的维护任务，SQL 模式定期清理已过期会话。
	workerDone := make(chan struct{})
	go func() {
		defer close(workerDone)
		if postgres == nil {
			return
		}
		ticker := time.NewTicker(time.Minute)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case now := <-ticker.C:
				cleanup, cancel := context.WithTimeout(ctx, 3*time.Second)
				if err := postgres.PruneSessions(cleanup, now); err != nil && ctx.Err() == nil {
					logger.Warn("session cleanup failed")
				}
				cancel()
			}
		}
	}()
	select {
	case err = <-finished:
		stop()
		<-workerDone
		if !errors.Is(err, http.ErrServerClosed) {
			return err
		}
		return nil
	case <-ctx.Done():
	}
	shutdown, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err = server.Shutdown(shutdown); err != nil {
		_ = server.Close()
		<-workerDone
		return fmt.Errorf("shutdown timeout")
	}
	if err = <-finished; err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	<-workerDone
	logger.Info("shutdown complete")
	return nil
}

func validateProduction(dsn, originScheme string) error {
	if dsn == "" || originScheme != "https" {
		return fmt.Errorf("production requires DATABASE_URL and HTTPS ALLOWED_ORIGIN")
	}
	connection, err := url.Parse(dsn)
	if err != nil || (connection.Scheme != "postgres" && connection.Scheme != "postgresql") || connection.Host == "" || connection.Query().Get("sslmode") != "verify-full" {
		return fmt.Errorf("production requires a PostgreSQL URL with sslmode=verify-full")
	}
	return nil
}
