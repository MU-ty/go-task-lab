package testingexample

import "testing"

func TestAdd(t *testing.T) {
	cases := []struct {
		name       string
		a, b, want int
	}{
		{"普通值", 3, 2, 5},
		{"零值", 0, 0, 0},
		{"负数抵消", -1, 1, 0},
		{"两个负数", -3, -2, -5},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := Add(tc.a, tc.b); got != tc.want {
				t.Fatalf("Add(%d, %d)=%d want=%d", tc.a, tc.b, got, tc.want)
			}
		})
	}
}
