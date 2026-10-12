package main

import "testing"

func TestProductionConfig(t *testing.T) {
	cases := []struct {
		dsn, scheme string
		valid       bool
	}{
		{"", "https", false},
		{"postgres://localhost/lab?sslmode=verify-full", "http", false},
		{"postgres://localhost/lab?sslmode=disable", "https", false},
		{"postgres://localhost/lab?sslmode=require", "https", false},
		{"https://localhost/lab?sslmode=verify-full", "https", false},
		{"postgres://localhost/lab?sslmode=verify-full", "https", true},
	}
	for _, tc := range cases {
		if got := validateProduction(tc.dsn, tc.scheme) == nil; got != tc.valid {
			t.Errorf("scheme=%s got=%t want=%t", tc.scheme, got, tc.valid)
		}
	}
}
