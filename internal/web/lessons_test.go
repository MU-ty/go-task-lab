package web

import (
	"encoding/json"
	"fmt"
	"testing"
)

func TestLessonOutputs(t *testing.T) {
	cases := []struct{ id, want string }{
		{"hello", "Hello, Go!\n"}, {"variables", "Go 3 7\n"},
		{"conditions", "继续练习 30\n"}, {"loops", "总和: 6\n"},
		{"functions", "5\n"}, {"slices", "0 1\n1 2\n2 3\n"},
		{"maps", "3 true\n1\n"}, {"structs", "小 Go 4\n"},
		{"interfaces", "你好，小 Go\n"}, {"concurrency", "平方和: 14\n"},
	}
	h := testHandler(t)
	for _, tc := range cases {
		t.Run(tc.id, func(t *testing.T) {
			w := request(h, "GET", "/api/lessons/"+tc.id+"/run?n=3", "")
			var body struct {
				Output string `json:"output"`
			}
			if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
				t.Fatal(err)
			}
			if w.Code != 200 || body.Output != tc.want {
				t.Fatalf("status=%d output=%q want=%q", w.Code, body.Output, tc.want)
			}
		})
	}
}

func TestLessonParameters(t *testing.T) {
	h := testHandler(t)
	for _, raw := range []string{"0", "10", "-1", "1.5", "text"} {
		w := request(h, "GET", "/api/lessons/loops/run?n="+raw, "")
		if w.Code != 400 {
			t.Fatalf("参数 %q: %d", raw, w.Code)
		}
	}
	if w := request(h, "GET", "/api/lessons/unknown/run", ""); w.Code != 404 {
		t.Fatalf("未知课程: %d", w.Code)
	}
	for n := 1; n <= 9; n++ {
		output, ok := ExampleOutput("concurrency", n)
		want := fmt.Sprintf("平方和: %d\n", n*(n+1)*(2*n+1)/6)
		if !ok || output != want {
			t.Fatalf("n=%d output=%q want=%q", n, output, want)
		}
	}
	if output, _ := ExampleOutput("conditions", 6); output != "通过 60\n" {
		t.Fatalf("边界条件: %q", output)
	}
}
