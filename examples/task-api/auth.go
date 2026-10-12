package taskapi

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"net"
	"sync"
	"time"
)

func randomToken() (string, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(raw), nil
}
func tokenDigest(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

type rateEntry struct {
	count int
	reset time.Time
}
type authLimiter struct {
	mu      sync.Mutex
	entries map[string]rateEntry
	budget  int
	window  time.Duration
}

func newLimiter(budget int) *authLimiter {
	return &authLimiter{entries: make(map[string]rateEntry), budget: budget, window: time.Minute}
}
func (l *authLimiter) allow(address string, now time.Time) bool {
	// 仅信任 TCP 对端；反向代理需要另行显式配置可信代理。
	host, _, err := net.SplitHostPort(address)
	if err != nil {
		host = address
	}
	l.mu.Lock()
	defer l.mu.Unlock()
	for key, entry := range l.entries {
		if !now.Before(entry.reset) {
			delete(l.entries, key)
		}
	}
	entry, ok := l.entries[host]
	if !ok {
		if len(l.entries) >= 10000 {
			return false
		}
		entry.reset = now.Add(l.window)
	}
	if entry.count >= l.budget {
		return false
	}
	entry.count++
	l.entries[host] = entry
	return true
}
