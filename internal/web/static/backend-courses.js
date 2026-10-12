// Generated from curriculum/backend.cjs.
COURSES.push(...[
  {
    "id": "backend-setup",
    "title": "后端工程、模块与配置",
    "group": "HTTP 与 API",
    "prerequisites": [
      "testing"
    ],
    "description": "从单文件程序走到可复现的服务工程，明确启动入口与运行配置。",
    "concepts": [
      [
        "模块与目录职责",
        "go.mod 声明模块路径与 Go 版本，go.sum 校验依赖内容。cmd 放启动入口，internal 放项目内部实现；结构应跟着职责划分，避免在每个包中都创建全局配置与数据库连接。"
      ],
      [
        "配置在启动时读取和校验",
        "地址、数据库 DSN 和环境从配置入口进入，缺失或非法值应导致启动失败。秘密通过环境或秘密管理服务注入，不写进 Git；开发环境默认值与生产要求要区分。"
      ],
      [
        "可复现的开发反馈",
        "先 go mod download，再 go test ./... 与 go vet ./...；通过 go run ./cmd/api 启动服务。版本固定在 go.mod，依赖更改后 go mod tidy 并提交 go.sum。"
      ]
    ],
    "lab": {
      "goal": "启动毕业项目的内存版 API。",
      "steps": [
        "安装项目 go.mod 指定的 Go 版本，克隆仓库。",
        "进入 examples/task-api，执行 go mod download 与 go test ./...。",
        "执行 go run ./cmd/api，在另一个终端请求 GET http://127.0.0.1:8090/healthz。"
      ],
      "acceptance": "能看到 200 与 JSON；修改监听端口后能在新端口访问，非法配置必须启动失败。",
      "source": "https://github.com/MU-ty/go-task-lab/blob/main/examples/task-api/cmd/api/main.go",
      "code": "cd examples/task-api\ngo mod download\ngo test ./...\ngo run ./cmd/api\n# 第二个终端：\ncurl http://127.0.0.1:8090/healthz"
    },
    "level": "后端",
    "parameter": true,
    "resources": [
      [
        "Go 官方模块教程",
        "https://go.dev/doc/tutorial/create-module"
      ]
    ],
    "goals": [
      "从单文件程序走到可复现的服务工程，明确启动入口与运行配置。",
      "启动毕业项目的内存版 API。"
    ],
    "hint": "这是可在浏览器运行的独立实验；真实监听端口、数据库和部署请完成「后端实战」页签。",
    "challenge": "能看到 200 与 JSON；修改监听端口后能在新端口访问，非法配置必须启动失败。",
    "choice": {
      "question": "配置应该在哪里读取和验证？",
      "options": [
        "每条 SQL 执行前",
        "服务启动入口",
        "浏览器里"
      ],
      "answer": 1,
      "explanation": "启动时统一校验依赖配置，缺失或非法值应尽早失败。"
    },
    "fill": {
      "question": "整理模块依赖并更新 go.sum。",
      "snippet": "go mod ____",
      "answers": [
        "tidy"
      ],
      "explanation": "tidy 清理并补齐模块依赖。"
    },
    "pitfall": "根模块的 go test ./... 不会遍历另一个 go.mod 所在的子模块。毕业项目需要进入它的目录单独测试。",
    "steps": [
      "模块与目录职责",
      "配置在启动时读取和校验",
      "先预测独立实验输出，再完成后端实战验收。"
    ],
    "code": "package main\n\nimport (\n    \"fmt\"\n    \"strconv\"\n)\n\n\n\nfunc main() {\n    config := map[string]string{\"PORT\": fmt.Sprint(8000 + {{n}})}\n    port, err := strconv.Atoi(config[\"PORT\"])\n    if err != nil || port < 1 || port > 65535 { panic(\"端口无效\") }\n    fmt.Println(\"监听端口:\", port)\n    fmt.Println(\"配置校验:\", err == nil)\n}\n"
  },
  {
    "id": "http-handler",
    "title": "HTTP 请求、响应与 Handler",
    "group": "HTTP 与 API",
    "prerequisites": [
      "interfaces",
      "backend-setup"
    ],
    "description": "理解一次 HTTP 交互，并用 net/http 写出第一个处理器。",
    "concepts": [
      [
        "Handler 接收请求、写出响应",
        "http.Handler 的 ServeHTTP(w, r) 是服务边界；HandlerFunc 适配普通函数。Request 包含方法、URL、头和 Body，ResponseWriter 用来设置头、状态码和响应体。"
      ],
      [
        "响应头先于响应体",
        "先 Header().Set，再 WriteHeader，最后写入 Body。首次 Write 会隐式提交 200，此后再改状态或普通响应头不会改写已提交内容。"
      ],
      [
        "httptest 与真实服务",
        "NewRequest 与 NewRecorder 在进程内执行同一处理器，不监听网络端口。它适合网站实验和单元测试；真实服务需要 Server.ListenAndServe，毕业项目提供该入口。"
      ]
    ],
    "lab": {
      "goal": "添加 GET /hello 端点。",
      "steps": [
        "在毕业项目的路由构建处添加处理器。",
        "显式设置 Content-Type 与状态码。",
        "使用 curl -i 检查头和正文。"
      ],
      "acceptance": "GET 返回 200；先写正文再改状态的错误写法能通过测试被发现。",
      "source": "https://github.com/MU-ty/go-task-lab/blob/main/examples/task-api/api.go",
      "code": "curl -i http://127.0.0.1:8090/healthz"
    },
    "level": "后端",
    "parameter": true,
    "resources": [
      [
        "net/http 官方文档",
        "https://pkg.go.dev/net/http"
      ]
    ],
    "goals": [
      "理解一次 HTTP 交互，并用 net/http 写出第一个处理器。",
      "添加 GET /hello 端点。"
    ],
    "hint": "这是可在浏览器运行的独立实验；真实监听端口、数据库和部署请完成「后端实战」页签。",
    "challenge": "GET 返回 200；先写正文再改状态的错误写法能通过测试被发现。",
    "choice": {
      "question": "设置响应状态最晚应在什么时候？",
      "options": [
        "第一次写正文之前",
        "写完正文之后",
        "连接关闭之后"
      ],
      "answer": 0,
      "explanation": "首次 Write 通常会提交 200，后续改状态不能撤回已提交响应。"
    },
    "fill": {
      "question": "显式返回创建成功状态。",
      "snippet": "w.____(http.StatusCreated)",
      "answers": [
        "WriteHeader"
      ],
      "explanation": "WriteHeader 提交指定 HTTP 状态。"
    },
    "pitfall": "第一次写正文就可能提交 200；不要在 fmt.Fprint 之后才试图修改状态码或响应头。",
    "steps": [
      "Handler 接收请求、写出响应",
      "响应头先于响应体",
      "先预测独立实验输出，再完成后端实战验收。"
    ],
    "code": "package main\n\nimport (\n    \"fmt\"\n    \"net/http\"\n    \"net/http/httptest\"\n)\n\n\n\nfunc main() {\n    h := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {\n        w.Header().Set(\"Content-Type\", \"text/plain; charset=utf-8\")\n        w.WriteHeader(http.StatusOK)\n        fmt.Fprintf(w, \"Hello, backend %d!\", {{n}})\n    })\n    rec := httptest.NewRecorder()\n    h.ServeHTTP(rec, httptest.NewRequest(\"GET\", \"/hello\", nil))\n    fmt.Println(\"状态:\", rec.Code)\n    fmt.Println(\"正文:\", rec.Body.String())\n}\n"
  },
  {
    "id": "http-routing",
    "title": "方法路由、路径参数与查询参数",
    "group": "HTTP 与 API",
    "prerequisites": [
      "http-handler"
    ],
    "description": "用 Go 1.22 的 ServeMux 路由语法分发请求并校验输入。",
    "concepts": [
      [
        "方法与资源路径一起匹配",
        "GET /tasks/{id} 同时约束方法与路径，PathValue(\"id\") 读取捕获值。URL.Query().Get 读取查询参数；不要把路径 ID 与分页参数混为一谈。"
      ],
      [
        "解析成功不代表合法",
        "strconv.Atoi 解决字符串转换，之后仍要检查 ID>0、分页上限等规则。客户端输入错误用 400 返回，不应触发 panic。"
      ],
      [
        "404 与 405 的区别",
        "资源路由不存在通常是 404；匹配到路径但方法不允许可返回 405 和 Allow。Go 的 GET 模式也匹配 HEAD，HEAD 响应不应依赖可读取的正文。"
      ]
    ],
    "lab": {
      "goal": "实现并测试路径 ID 校验。",
      "steps": [
        "定位 GET /tasks/{id} 与 PATCH /tasks/{id}。",
        "比较非法 ID、缺失资源与不支持的方法。",
        "为三种失败分别编写 httptest 用例。"
      ],
      "acceptance": "abc 与 0 返回 400，合法但不存在的 ID 返回 404，错误方法返回 405。",
      "source": "https://github.com/MU-ty/go-task-lab/blob/main/examples/task-api/api_test.go",
      "code": ""
    },
    "level": "后端",
    "parameter": true,
    "resources": [
      [
        "net/http 官方文档",
        "https://pkg.go.dev/net/http"
      ]
    ],
    "goals": [
      "用 Go 1.22 的 ServeMux 路由语法分发请求并校验输入。",
      "实现并测试路径 ID 校验。"
    ],
    "hint": "这是可在浏览器运行的独立实验；真实监听端口、数据库和部署请完成「后端实战」页签。",
    "challenge": "abc 与 0 返回 400，合法但不存在的 ID 返回 404，错误方法返回 405。",
    "choice": {
      "question": "从 /tasks/{id} 读取 id 应用什么？",
      "options": [
        "URL.Query().Get",
        "PathValue",
        "Header.Get"
      ],
      "answer": 1,
      "explanation": "PathValue 读取路由捕获，Query 读取问号后的参数。"
    },
    "fill": {
      "question": "读取路径捕获值。",
      "snippet": "id := r.____(\"id\")",
      "answers": [
        "PathValue"
      ],
      "explanation": "Go 1.22 ServeMux 的路径捕获通过 PathValue 读取。"
    },
    "pitfall": "路径参数仍是不可信字符串。解析为数字后也要拒绝 0、负数和超出业务范围的值。",
    "steps": [
      "方法与资源路径一起匹配",
      "解析成功不代表合法",
      "先预测独立实验输出，再完成后端实战验收。"
    ],
    "code": "package main\n\nimport (\n    \"fmt\"\n    \"net/http\"\n    \"net/http/httptest\"\n    \"strconv\"\n)\n\n\n\nfunc main() {\n    mux := http.NewServeMux()\n    mux.HandleFunc(\"GET /tasks/{id}\", func(w http.ResponseWriter, r *http.Request) {\n        id, err := strconv.Atoi(r.PathValue(\"id\"))\n        if err != nil || id < 1 { http.Error(w, \"invalid id\", 400); return }\n        fmt.Fprintf(w, \"task=%d page=%s\", id, r.URL.Query().Get(\"page\"))\n    })\n    rec := httptest.NewRecorder()\n    mux.ServeHTTP(rec, httptest.NewRequest(\"GET\", fmt.Sprintf(\"/tasks/%d?page=2\", {{n}}), nil))\n    fmt.Println(rec.Code, rec.Body.String())\n    wrong := httptest.NewRecorder()\n    mux.ServeHTTP(wrong, httptest.NewRequest(\"POST\", \"/tasks/1\", nil))\n    fmt.Println(\"错误方法:\", wrong.Code)\n}\n"
  },
  {
    "id": "http-json",
    "title": "JSON 请求、验证与统一错误响应",
    "group": "HTTP 与 API",
    "prerequisites": [
      "json",
      "http-handler"
    ],
    "description": "拒绝未知字段和多段 JSON，控制输入边界并建立稳定错误格式。",
    "concepts": [
      [
        "限制大小并严格解码",
        "先检查 Content-Type，再用 MaxBytesReader 限制 Body，Decoder.DisallowUnknownFields 拒绝拼错的字段。超过限制用 413，格式错误用 400，不暴露内部堆栈。"
      ],
      [
        "只允许一个 JSON 值",
        "第一次 Decode 成功后，再 Decode 并要求 io.EOF，避免 {..}{..} 被当作合法单条请求。输入类型转换之后再做非空、长度和业务校验。"
      ],
      [
        "错误是 API 合同的一部分",
        "采用一致的 {\"error\":\"...\"} 或带 code 的错误对象；未登录 401，资源不存在 404，冲突 409。HTTP 状态用于机器判断，信息用于解释，不把数据库原始错误直接发送给用户。"
      ]
    ],
    "lab": {
      "goal": "完成注册与创建任务的输入失败测试。",
      "steps": [
        "分别发送拼错字段、空标题和两段 JSON。",
        "查看 decodeJSON 的大小限制与 EOF 检查。",
        "保证失败请求不会创建用户或任务。"
      ],
      "acceptance": "未知字段、重复 JSON 与空标题返回 400；错误类型返回 415；超大 Body 返回 413。",
      "source": "https://github.com/MU-ty/go-task-lab/blob/main/examples/task-api/api.go",
      "code": ""
    },
    "level": "后端",
    "parameter": true,
    "resources": [
      [
        "net/http 官方文档",
        "https://pkg.go.dev/net/http"
      ]
    ],
    "goals": [
      "拒绝未知字段和多段 JSON，控制输入边界并建立稳定错误格式。",
      "完成注册与创建任务的输入失败测试。"
    ],
    "hint": "这是可在浏览器运行的独立实验；真实监听端口、数据库和部署请完成「后端实战」页签。",
    "challenge": "未知字段、重复 JSON 与空标题返回 400；错误类型返回 415；超大 Body 返回 413。",
    "choice": {
      "question": "第一次 Decode 成功后，再次 Decode 应得到什么才允许只有一个 JSON？",
      "options": [
        "nil",
        "io.EOF",
        "200"
      ],
      "answer": 1,
      "explanation": "EOF 说明没有第二个 JSON 值；nil 说明又读到了一个值。"
    },
    "fill": {
      "question": "拒绝未定义 JSON 字段。",
      "snippet": "decoder.____()",
      "answers": [
        "DisallowUnknownFields"
      ],
      "explanation": "严格解码能发现拼错字段。"
    },
    "pitfall": "只调用一次 Decode 会漏掉第二段 JSON。严格字段检查也不能代替标题、长度和业务校验。",
    "steps": [
      "限制大小并严格解码",
      "只允许一个 JSON 值",
      "先预测独立实验输出，再完成后端实战验收。"
    ],
    "code": "package main\n\nimport (\n    \"fmt\"\n    \"encoding/json\"\n    \"io\"\n    \"strings\"\n)\n\n\n\nfunc main() {\n    var req struct { Title string }\n    d := json.NewDecoder(strings.NewReader(fmt.Sprintf(\"{\\\"title\\\":\\\"task %d\\\"}\", {{n}})))\n    d.DisallowUnknownFields()\n    err := d.Decode(&req)\n    var extra any\n    end := d.Decode(&extra)\n    fmt.Println(\"单个 JSON:\", err == nil && end == io.EOF)\n    fmt.Println(\"标题:\", req.Title)\n    bad := json.NewDecoder(strings.NewReader(\"{\\\"titel\\\":\\\"typo\\\"}\"))\n    bad.DisallowUnknownFields()\n    fmt.Println(\"拒绝未知字段:\", bad.Decode(&req) != nil)\n}\n"
  },
  {
    "id": "rest-crud",
    "title": "REST 资源与 CRUD 合同",
    "group": "HTTP 与 API",
    "prerequisites": [
      "http-routing",
      "http-json"
    ],
    "description": "定义增删改查的资源合同，让客户端知道如何创建和操作任务。",
    "concepts": [
      [
        "资源名与 HTTP 方法",
        "POST /tasks 创建，GET /tasks 查询集合，GET /tasks/{id} 查询单项，PATCH 更新部分字段，DELETE 删除。选择能表达操作结果的状态码，不让所有请求一律返回 200。"
      ],
      [
        "201、Location 与 204",
        "创建成功返回 201 并用 Location 指向新资源；删除成功可返回 204，204 不携带正文。GET 不修改资源，DELETE 的幂等性表示重复执行不产生额外效果，不要求每次状态完全相同。"
      ],
      [
        "部分更新需要区分缺失与零值",
        "PATCH 中 *bool 可以区分未提交 done 与显式提交 false。更新应只修改提交的字段，同时验证空补丁或无效字段。合同先于实现，项目的 openapi.yaml 给出完整约定。"
      ]
    ],
    "lab": {
      "goal": "完成任务从创建到删除的一条真实请求链。",
      "steps": [
        "先注册并登录，保存返回的 token。",
        "创建任务，按 Location 查询，PATCH done=true。",
        "删除任务，再查询相同 ID。"
      ],
      "acceptance": "创建 201、读取 200、修改 200、删除 204；删除后查询 404；显式 done=false 可撤销完成状态。",
      "source": "https://github.com/MU-ty/go-task-lab/blob/main/examples/task-api/openapi.yaml",
      "code": ""
    },
    "level": "后端",
    "parameter": true,
    "resources": [
      [
        "net/http 官方文档",
        "https://pkg.go.dev/net/http"
      ]
    ],
    "goals": [
      "定义增删改查的资源合同，让客户端知道如何创建和操作任务。",
      "完成任务从创建到删除的一条真实请求链。"
    ],
    "hint": "这是可在浏览器运行的独立实验；真实监听端口、数据库和部署请完成「后端实战」页签。",
    "challenge": "创建 201、读取 200、修改 200、删除 204；删除后查询 404；显式 done=false 可撤销完成状态。",
    "choice": {
      "question": "PATCH 要区分不传 done 与传 false，字段类型应使用哪个？",
      "options": [
        "bool",
        "*bool",
        "string"
      ],
      "answer": 1,
      "explanation": "指针 nil 表示未提交，指向 false 表示显式提交 false。"
    },
    "fill": {
      "question": "创建成功使用哪个 HTTP 常量？",
      "snippet": "w.WriteHeader(http.____)",
      "answers": [
        "StatusCreated"
      ],
      "explanation": "StatusCreated 对应 201。"
    },
    "pitfall": "PATCH 使用普通 bool 会把未提交与显式 false 混为一谈，导致无法正确取消完成状态。",
    "steps": [
      "资源名与 HTTP 方法",
      "201、Location 与 204",
      "先预测独立实验输出，再完成后端实战验收。"
    ],
    "code": "package main\n\nimport (\n    \"fmt\"\n    \"net/http\"\n    \"net/http/httptest\"\n)\n\n\n\nfunc main() {\n    mux := http.NewServeMux()\n    mux.HandleFunc(\"POST /tasks\", func(w http.ResponseWriter, r *http.Request) {\n        w.Header().Set(\"Location\", fmt.Sprintf(\"/tasks/%d\", {{n}}))\n        w.WriteHeader(http.StatusCreated)\n    })\n    mux.HandleFunc(\"DELETE /tasks/{id}\", func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusNoContent) })\n    created := httptest.NewRecorder()\n    mux.ServeHTTP(created, httptest.NewRequest(\"POST\", \"/tasks\", nil))\n    fmt.Println(\"创建:\", created.Code, created.Header().Get(\"Location\"))\n    deleted := httptest.NewRecorder()\n    mux.ServeHTTP(deleted, httptest.NewRequest(\"DELETE\", \"/tasks/1\", nil))\n    fmt.Println(\"删除:\", deleted.Code, deleted.Body.Len())\n}\n"
  },
  {
    "id": "middleware",
    "title": "中间件组合与执行顺序",
    "group": "HTTP 与 API",
    "prerequisites": [
      "closures",
      "http-handler"
    ],
    "description": "将认证、日志和错误恢复组合成清晰的请求管道。",
    "concepts": [
      [
        "中间件是 Handler 到 Handler",
        "func(next http.Handler) http.Handler 返回包装后的处理器。通用逻辑在 next.ServeHTTP 前后执行，业务处理器保持聚焦。链条顺序写清楚，例如日志包住恢复，再包住鉴权。"
      ],
      [
        "前进顺序与返回顺序相反",
        "outer(inner(handler)) 的前置逻辑先 outer 再 inner，后置逻辑反向执行。拒绝请求时不调用 next，因此不会进入受保护业务；测试要同时覆盖正常与拒绝路径。"
      ],
      [
        "恢复、日志与响应提交",
        "recover 只恢复当前 goroutine。恢复中间件不能撤回已写出的正文，尽量在业务写响应前完成可能失败的步骤。记录状态码的 ResponseWriter 包装器也应考虑 Flusher 等可选接口。"
      ]
    ],
    "parameter": false,
    "lab": {
      "goal": "为受保护端点验证短路行为。",
      "steps": [
        "查看 authentication 与请求日志包装位置。",
        "不带 token 请求 POST /tasks。",
        "测试业务仓储调用次数为 0。"
      ],
      "acceptance": "拒绝请求返回 401 且不会创建任务；合法 token 只调用一次业务处理器。",
      "source": "https://github.com/MU-ty/go-task-lab/blob/main/examples/task-api/api.go",
      "code": ""
    },
    "level": "后端",
    "resources": [
      [
        "net/http 官方文档",
        "https://pkg.go.dev/net/http"
      ]
    ],
    "goals": [
      "将认证、日志和错误恢复组合成清晰的请求管道。",
      "为受保护端点验证短路行为。"
    ],
    "hint": "这是可在浏览器运行的独立实验；真实监听端口、数据库和部署请完成「后端实战」页签。",
    "challenge": "拒绝请求返回 401 且不会创建任务；合法 token 只调用一次业务处理器。",
    "choice": {
      "question": "鉴权失败时，中间件应怎样处理 next？",
      "options": [
        "仍调用一次",
        "不调用 next",
        "调用两次"
      ],
      "answer": 1,
      "explanation": "拒绝路径必须短路，业务逻辑不能继续执行。"
    },
    "fill": {
      "question": "让下一个处理器继续执行。",
      "snippet": "next.____(w, r)",
      "answers": [
        "ServeHTTP"
      ],
      "explanation": "Handler 的调用入口是 ServeHTTP。"
    },
    "pitfall": "鉴权失败后必须直接返回。写完 401 仍调用 next 会让未认证请求继续修改数据。",
    "steps": [
      "中间件是 Handler 到 Handler",
      "前进顺序与返回顺序相反",
      "先预测独立实验输出，再完成后端实战验收。"
    ],
    "code": "package main\n\nimport (\n    \"fmt\"\n    \"net/http\"\n    \"net/http/httptest\"\n    \"strings\"\n)\n\n\n\nfunc main() {\n    var trace []string\n    wrap := func(name string, next http.Handler) http.Handler {\n        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {\n            trace = append(trace, name + \":before\")\n            next.ServeHTTP(w, r)\n            trace = append(trace, name + \":after\")\n        })\n    }\n    h := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { trace = append(trace, \"handler\") })\n    wrap(\"outer\", wrap(\"inner\", h)).ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(\"GET\", \"/\", nil))\n    fmt.Println(strings.Join(trace, \" -> \"))\n}\n"
  },
  {
    "id": "request-context",
    "title": "请求取消与数据库超时",
    "group": "HTTP 与 API",
    "prerequisites": [
      "context",
      "middleware"
    ],
    "description": "将请求上下文传到底层，让取消真正影响工作。",
    "concepts": [
      [
        "从 r.Context 派生业务超时",
        "handler 使用 r.Context()，再用 WithTimeout 设置业务上限，defer cancel。上下文作为第一个参数传到 service、repository 与 QueryContext，不在内部重新创建 Background 丢掉取消。"
      ],
      [
        "取消需要下游配合",
        "数据库驱动、HTTP 客户端和 channel 发送都要支持 ctx。不要为每次请求随意启动无法回收的 goroutine。超时状态按服务合同决定；客户端已断开时也可能无法再发响应。"
      ],
      [
        "HTTP 服务超时与业务超时不同",
        "ReadHeaderTimeout 约束请求头读取，IdleTimeout 约束空闲连接，数据库 timeout 约束单次业务操作。它们互相补充，不能以一个全局超时替代所有边界。"
      ]
    ],
    "parameter": false,
    "lab": {
      "goal": "确保 SQL 操作收到请求上下文。",
      "steps": [
        "检查 SQLStore 中每个查询均使用 Context 版本。",
        "为仓储传入已取消的 ctx，断言返回取消错误。",
        "对数据库查询派生超时，并测试无法持续等待。"
      ],
      "acceptance": "取消后不再提交新操作；上下文不会在仓储中被替换为 Background。",
      "source": "https://github.com/MU-ty/go-task-lab/blob/main/examples/task-api/store.go",
      "code": ""
    },
    "level": "后端",
    "resources": [
      [
        "net/http 官方文档",
        "https://pkg.go.dev/net/http"
      ]
    ],
    "goals": [
      "将请求上下文传到底层，让取消真正影响工作。",
      "确保 SQL 操作收到请求上下文。"
    ],
    "hint": "这是可在浏览器运行的独立实验；真实监听端口、数据库和部署请完成「后端实战」页签。",
    "challenge": "取消后不再提交新操作；上下文不会在仓储中被替换为 Background。",
    "choice": {
      "question": "数据库查询应该接收哪一个上下文？",
      "options": [
        "请求派生的 ctx",
        "新的 Background 丢弃取消",
        "nil"
      ],
      "answer": 0,
      "explanation": "传递请求上下文才能让取消影响底层操作。"
    },
    "fill": {
      "question": "取得请求上下文。",
      "snippet": "ctx := r.____()",
      "answers": [
        "Context"
      ],
      "explanation": "Request.Context 获取当前请求的上下文。"
    },
    "pitfall": "仓储中重新使用 context.Background 会切断请求取消传播；超时信号也不会自动杀死未监听的 goroutine。",
    "steps": [
      "从 r.Context 派生业务超时",
      "取消需要下游配合",
      "先预测独立实验输出，再完成后端实战验收。"
    ],
    "code": "package main\n\nimport (\n    \"fmt\"\n    \"context\"\n    \"net/http\"\n    \"net/http/httptest\"\n)\n\n\n\nfunc main() {\n    ctx, cancel := context.WithCancel(context.Background())\n    cancel()\n    req := httptest.NewRequest(\"GET\", \"/slow\", nil).WithContext(ctx)\n    h := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {\n        select {\n        case <-r.Context().Done(): http.Error(w, \"request canceled\", 503)\n        default: fmt.Fprint(w, \"completed\")\n        }\n    })\n    rec := httptest.NewRecorder()\n    h.ServeHTTP(rec, req)\n    fmt.Println(\"取消请求:\", rec.Code)\n    fmt.Println(\"取消原因:\", req.Context().Err())\n}\n"
  },
  {
    "id": "http-client",
    "title": "调用外部 API 与 HTTP Client",
    "group": "HTTP 与 API",
    "prerequisites": [
      "request-context"
    ],
    "description": "复用客户端、设置超时、关闭响应体，并处理非 2xx 状态。",
    "concepts": [
      [
        "复用 Client 与 Transport",
        "http.Client 与默认 Transport 适合复用，避免每次请求创建新的连接池。设置总超时并使用 NewRequestWithContext；不受信任的 URL 需要白名单，避免服务端请求伪造。"
      ],
      [
        "Do 的 nil error 不代表成功",
        "Do 成功仅表示 HTTP 交互成功，404 或 500 仍可能是 nil error。先检查 StatusCode，再按协议读取有限大小的响应，defer resp.Body.Close。"
      ],
      [
        "重试遵守幂等性和预算",
        "只在明确的暂时失败上重试，限定次数、退避与总时限。POST 创建任务不能无条件重试；设计幂等键或确保没有副作用。网站用注入 Transport 代替真实外网请求，保持可复现。"
      ]
    ],
    "lab": {
      "goal": "独立写一个可注入 Transport 的上游客户端。",
      "steps": [
        "使用 httptest.Server 提供 200、500 和延迟三条路径。",
        "实现 StatusCode 检查、响应大小限制与取消。",
        "仅为允许重试的 GET 加入有限重试。"
      ],
      "acceptance": "非 2xx 返回业务错误；超时可退出；Body 被关闭；不依赖真实外网测试。",
      "source": "https://github.com/MU-ty/go-task-lab/blob/main/examples/task-api/README.md",
      "code": ""
    },
    "level": "后端",
    "parameter": true,
    "resources": [
      [
        "net/http 官方文档",
        "https://pkg.go.dev/net/http"
      ]
    ],
    "goals": [
      "复用客户端、设置超时、关闭响应体，并处理非 2xx 状态。",
      "独立写一个可注入 Transport 的上游客户端。"
    ],
    "hint": "这是可在浏览器运行的独立实验；真实监听端口、数据库和部署请完成「后端实战」页签。",
    "challenge": "非 2xx 返回业务错误；超时可退出；Body 被关闭；不依赖真实外网测试。",
    "choice": {
      "question": "Client.Do 返回 nil error 是否意味着上游成功？",
      "options": [
        "是",
        "否，还要检查状态码",
        "只对 POST 是"
      ],
      "answer": 1,
      "explanation": "HTTP 500 也可能没有网络错误，必须按合同检查 StatusCode。"
    },
    "fill": {
      "question": "在读取后释放响应体。",
      "snippet": "defer resp.Body.____()",
      "answers": [
        "Close"
      ],
      "explanation": "关闭 Body 释放连接资源。"
    },
    "pitfall": "Client.Do 的 nil error 不代表 2xx，也不替你关闭 Body。不要对有副作用的请求无限重试。",
    "steps": [
      "复用 Client 与 Transport",
      "Do 的 nil error 不代表成功",
      "先预测独立实验输出，再完成后端实战验收。"
    ],
    "code": "package main\n\nimport (\n    \"fmt\"\n    \"io\"\n    \"net/http\"\n    \"strings\"\n    \"time\"\n)\n\ntype LessonTransport func(*http.Request) (*http.Response, error)\nfunc (f LessonTransport) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }\n\nfunc main() {\n    client := &http.Client{Timeout: 2*time.Second, Transport: LessonTransport(func(r *http.Request) (*http.Response, error) {\n        return &http.Response{StatusCode: 200, Header: make(http.Header), Body: io.NopCloser(strings.NewReader(fmt.Sprint({{n}})))}, nil\n    })}\n    req, err := http.NewRequest(\"GET\", \"https://example.test/count\", nil)\n    if err != nil { panic(err) }\n    resp, err := client.Do(req)\n    if err != nil { panic(err) }\n    defer resp.Body.Close()\n    data, err := io.ReadAll(io.LimitReader(resp.Body, 1024))\n    if err != nil { panic(err) }\n    fmt.Println(\"上游:\", resp.StatusCode, string(data))\n}\n"
  },
  {
    "id": "backend-layers",
    "title": "业务分层与依赖注入",
    "group": "数据与数据库",
    "prerequisites": [
      "interfaces",
      "rest-crud"
    ],
    "description": "用小接口分隔 HTTP、业务规则与存储，便于替换实现和测试。",
    "concepts": [
      [
        "HTTP 层不负责 SQL",
        "handler 解析请求、映射状态并写 JSON；业务规则与存储操作在边界清晰的组件中。不要为了层数而层数，简单服务可采用 handler+小 Store 接口，复杂规则再抽 service。"
      ],
      [
        "接口由使用者的需求驱动",
        "Store 只列出业务需要的方法，通常定义在使用它的包中。内存和 PostgreSQL 实现满足同一接口，构造函数显式接收依赖，避免通过全局变量选择实现。"
      ],
      [
        "稳定领域错误",
        "仓储返回 ErrNotFound、ErrConflict 等领域错误，HTTP 层映射为 404、409。底层连接异常记录内部日志并返回通用 500/503，不让调用方依赖某个数据库驱动错误字符串。"
      ]
    ],
    "lab": {
      "goal": "对同一套 API 运行内存与 PostgreSQL 仓储。",
      "steps": [
        "阅读 Store 接口与两个实现。",
        "使用 New(store, logger) 注入仓储。",
        "对同一合同执行 API 测试，不在 handler 中判断具体类型。"
      ],
      "acceptance": "替换仓储时 HTTP handler 无需改动；错误状态和响应结构保持一致。",
      "source": "https://github.com/MU-ty/go-task-lab/blob/main/examples/task-api/store.go",
      "code": ""
    },
    "level": "后端",
    "parameter": true,
    "resources": [
      [
        "net/http 官方文档",
        "https://pkg.go.dev/net/http"
      ]
    ],
    "goals": [
      "用小接口分隔 HTTP、业务规则与存储，便于替换实现和测试。",
      "对同一套 API 运行内存与 PostgreSQL 仓储。"
    ],
    "hint": "这是可在浏览器运行的独立实验；真实监听端口、数据库和部署请完成「后端实战」页签。",
    "challenge": "替换仓储时 HTTP handler 无需改动；错误状态和响应结构保持一致。",
    "choice": {
      "question": "哪种方式便于替换内存与 SQL 仓储？",
      "options": [
        "handler 内判断全局类型",
        "构造时注入小接口",
        "复制所有 handler"
      ],
      "answer": 1,
      "explanation": "依赖接口可以保持 HTTP 层不变，并支持测试替身。"
    },
    "fill": {
      "question": "使自定义类型满足错误接口的方法名。",
      "snippet": "func (e MyError) ____() string { return \"failed\" }",
      "answers": [
        "Error"
      ],
      "explanation": "Error() string 满足 error 接口。"
    },
    "pitfall": "全局 DB 和仓储变量会让测试互相影响。依赖通过构造函数显式传入，避免为分层而复制相同逻辑。",
    "steps": [
      "HTTP 层不负责 SQL",
      "接口由使用者的需求驱动",
      "先预测独立实验输出，再完成后端实战验收。"
    ],
    "code": "package main\n\nimport (\n    \"fmt\"\n    \"context\"\n    \"errors\"\n)\n\nvar ErrLessonNotFound = errors.New(\"not found\")\ntype LessonRepository interface { Get(context.Context, int) (string, error) }\ntype LessonMemory map[int]string\nfunc (m LessonMemory) Get(ctx context.Context, id int) (string, error) {\n    if err := ctx.Err(); err != nil { return \"\", err }\n    title, ok := m[id]; if !ok { return \"\", ErrLessonNotFound }; return title, nil\n}\n\nfunc main() {\n    var store LessonRepository = LessonMemory{ {{n}}: \"学习 Go 后端\" }\n    title, err := store.Get(context.Background(), {{n}})\n    fmt.Println(title, err == nil)\n    _, err = store.Get(context.Background(), 99)\n    fmt.Println(\"不存在:\", errors.Is(err, ErrLessonNotFound))\n}\n"
  },
  {
    "id": "sql-query",
    "title": "database/sql、参数化查询与连接池",
    "group": "数据与数据库",
    "prerequisites": [
      "backend-layers"
    ],
    "description": "将用户输入作为 SQL 参数，并正确管理查询、扫描与连接池。",
    "concepts": [
      [
        "DB 是连接池而不是单一连接",
        "sql.Open 建立池句柄，连接可延迟到真正查询；启动用 PingContext 验证。设置最大连接数、空闲数和生命周期；每次请求关闭 DB 会破坏池，DB 应随服务生命周期关闭。"
      ],
      [
        "参数化保护数据与语句边界",
        "PostgreSQL 用 $1、$2 占位符，QueryRowContext(ctx, query, id).Scan(&...) 传值。参数只能替代值，不能替代表名或 ORDER BY 关键字；动态排序使用固定白名单。"
      ],
      [
        "查询结果的生命周期",
        "QueryRow 的错误常在 Scan 时返回，sql.ErrNoRows 表示不存在。QueryContext 获得 Rows 后 defer Close，迭代后检查 Rows.Err。下面只观察语句与参数分离，真正查询在本机 PostgreSQL 项目完成。"
      ]
    ],
    "lab": {
      "goal": "用 PostgreSQL 执行真正的查询。",
      "steps": [
        "按项目 README 启动 Compose 并迁移数据库。",
        "检查每条查询都将 owner_id、id 和标题作为参数。",
        "创建标题包含单引号的任务，确认仍可原样保存。"
      ],
      "acceptance": "任务重启后仍存在；恶意标题是普通数据；不存在资源被映射为 404。",
      "source": "https://github.com/MU-ty/go-task-lab/blob/main/examples/task-api/sqlstore.go",
      "code": "// 片段：在已连接的 PostgreSQL DB 上执行\nerr := db.QueryRowContext(ctx,\n    \"SELECT id,title FROM tasks WHERE owner_id=$1 AND id=$2\",\n    ownerID, id).Scan(&task.ID, &task.Title)"
    },
    "resources": [
      [
        "Go 数据库教程",
        "https://go.dev/doc/database/"
      ],
      [
        "database/sql",
        "https://pkg.go.dev/database/sql"
      ]
    ],
    "level": "后端",
    "parameter": true,
    "goals": [
      "将用户输入作为 SQL 参数，并正确管理查询、扫描与连接池。",
      "用 PostgreSQL 执行真正的查询。"
    ],
    "hint": "这是可在浏览器运行的独立实验；真实监听端口、数据库和部署请完成「后端实战」页签。",
    "challenge": "任务重启后仍存在；恶意标题是普通数据；不存在资源被映射为 404。",
    "choice": {
      "question": "用户输入如何进入 SQL？",
      "options": [
        "拼接到语句字符串",
        "作为占位参数",
        "只转义空格"
      ],
      "answer": 1,
      "explanation": "参数化保持语句与数据分离；动态标识符仍需白名单。"
    },
    "fill": {
      "question": "读取单行查询结果。",
      "snippet": "err := db.QueryRowContext(ctx, query, id).____(&title)",
      "answers": [
        "Scan"
      ],
      "explanation": "QueryRow 的错误常在 Scan 时返回。"
    },
    "pitfall": "占位参数只能表示数据值，不能代替表名或排序关键字；浏览器打印 SQL 不等于已完成数据库查询。",
    "steps": [
      "DB 是连接池而不是单一连接",
      "参数化保护数据与语句边界",
      "先预测独立实验输出，再完成后端实战验收。"
    ],
    "code": "package main\n\nimport (\n    \"fmt\"\n    \"database/sql/driver\"\n)\n\n\n\nfunc main() {\n    query := \"SELECT id, title FROM tasks WHERE owner_id = $1 AND id = $2\"\n    args := []any{int64(1), int64({{n}})}\n    fmt.Println(query)\n    fmt.Println(\"参数:\", args)\n    fmt.Println(\"驱动值:\", driver.IsValue(args[0]) && driver.IsValue(args[1]))\n}\n"
  },
  {
    "id": "sql-migrations",
    "title": "数据库建模、约束与迁移",
    "group": "数据与数据库",
    "prerequisites": [
      "sql-query"
    ],
    "description": "让数据库也维护数据不变量，并用可审查的迁移管理结构。",
    "concepts": [
      [
        "主键、外键与唯一约束",
        "users 的主键识别用户，tasks.owner_id 的外键关联拥有者，email 的唯一约束阻止并发注册重复账号。应用校验改善反馈，数据库约束保证并发情况下仍成立。"
      ],
      [
        "迁移是有版本的结构变更",
        "提交有编号的 SQL 文件及已应用版本，使用事务和数据库锁避免多个实例同时迁移。毕业项目提供显式 migrate 子命令，避免每次请求甚至每个实例启动时随意改表。"
      ],
      [
        "上线顺序与回滚策略",
        "发布尽量采用增加兼容字段、迁移数据、再移除旧字段的步骤。schema 回滚可能丢数据，应用回滚前先确认兼容性；迁移前备份，备份还要实际演练恢复。"
      ]
    ],
    "parameter": false,
    "lab": {
      "goal": "应用并验证 001 迁移。",
      "steps": [
        "先启动数据库，再运行 go run ./cmd/api migrate。",
        "查询 schema_migrations 与 tasks 结构。",
        "再次迁移，确认不重复建表；尝试不存在用户的 owner_id。"
      ],
      "acceptance": "迁移幂等记录版本；无效外键不能写入；并发注册只允许一个相同 email。",
      "source": "https://github.com/MU-ty/go-task-lab/blob/main/examples/task-api/migrations/001_init.sql",
      "code": ""
    },
    "resources": [
      [
        "PostgreSQL 约束",
        "https://www.postgresql.org/docs/current/ddl-constraints.html"
      ]
    ],
    "level": "后端",
    "goals": [
      "让数据库也维护数据不变量，并用可审查的迁移管理结构。",
      "应用并验证 001 迁移。"
    ],
    "hint": "这是可在浏览器运行的独立实验；真实监听端口、数据库和部署请完成「后端实战」页签。",
    "challenge": "迁移幂等记录版本；无效外键不能写入；并发注册只允许一个相同 email。",
    "choice": {
      "question": "应用验证 email 唯一是否足以防止并发重复？",
      "options": [
        "足够",
        "还需要数据库唯一约束",
        "不需要验证"
      ],
      "answer": 1,
      "explanation": "并发请求可能同时通过应用检查，数据库唯一约束维护最终不变量。"
    },
    "fill": {
      "question": "SQL 中声明不可重复约束。",
      "snippet": "email TEXT NOT NULL ____",
      "answers": [
        "UNIQUE",
        "unique"
      ],
      "explanation": "UNIQUE 由数据库拒绝重复值。"
    },
    "pitfall": "先查询邮箱是否存在不能消除并发注册竞态。数据库 UNIQUE 约束才维护最终唯一性。",
    "steps": [
      "主键、外键与唯一约束",
      "迁移是有版本的结构变更",
      "先预测独立实验输出，再完成后端实战验收。"
    ],
    "code": "package main\n\nimport (\n    \"fmt\"\n    \"strings\"\n)\n\n\n\nfunc main() {\n    schema := \"CREATE TABLE tasks (id BIGSERIAL PRIMARY KEY, owner_id BIGINT NOT NULL REFERENCES users(id), title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120));\"\n    fmt.Println(\"主键:\", strings.Contains(schema, \"PRIMARY KEY\"))\n    fmt.Println(\"外键:\", strings.Contains(schema, \"REFERENCES users\"))\n    fmt.Println(\"约束:\", strings.Contains(schema, \"CHECK\"))\n}\n"
  },
  {
    "id": "sql-transactions",
    "title": "事务、提交与回滚",
    "group": "数据与数据库",
    "prerequisites": [
      "sql-query",
      "sql-migrations"
    ],
    "description": "将任务创建与审计写入作为一个不可分割的业务操作。",
    "concepts": [
      [
        "BeginTx 后所有操作使用 tx",
        "事务内用 tx.QueryRowContext 与 tx.ExecContext，不混用 db 的独立连接。成功才 Commit；defer Rollback 覆盖提前返回，提交后 Rollback 的 ErrTxDone 可忽略。"
      ],
      [
        "原子性与隔离性不是同一概念",
        "原子性保证多个变更全成功或全失败，隔离性影响并发读写之间能看到什么。选择适当隔离级别、唯一约束和行锁，不把事务当成所有并发问题的万能答案。"
      ],
      [
        "失败路径必须真正测试",
        "模拟第二条 SQL 失败，确认第一条写入也不存在。下面用临时副本演示提交边界，并没有执行数据库事务；毕业项目 SQLStore.CreateTask 用真正事务写入 tasks 与 audit_events。"
      ]
    ],
    "lab": {
      "goal": "验证创建任务与审计事件原子提交。",
      "steps": [
        "阅读 CreateTask 的 BeginTx、两个写入与 Commit。",
        "在独立测试数据库中使审计写入失败，断言任务未留下。",
        "恢复写入，确认两条记录同时存在。"
      ],
      "acceptance": "任一步失败都无半完成数据；所有查询用 ctx 与 tx；提交错误被处理。",
      "source": "https://github.com/MU-ty/go-task-lab/blob/main/examples/task-api/sqlstore_test.go",
      "code": "// 片段：真实数据库事务\ntx, err := db.BeginTx(ctx, nil)\nif err != nil { return err }\ndefer tx.Rollback()\n// 仅使用 tx 执行任务和审计写入\nreturn tx.Commit()"
    },
    "resources": [
      [
        "Go 官方事务指南",
        "https://go.dev/doc/database/execute-transactions"
      ]
    ],
    "level": "后端",
    "parameter": true,
    "goals": [
      "将任务创建与审计写入作为一个不可分割的业务操作。",
      "验证创建任务与审计事件原子提交。"
    ],
    "hint": "这是可在浏览器运行的独立实验；真实监听端口、数据库和部署请完成「后端实战」页签。",
    "challenge": "任一步失败都无半完成数据；所有查询用 ctx 与 tx；提交错误被处理。",
    "choice": {
      "question": "事务内应该使用哪一个对象执行所有操作？",
      "options": [
        "tx",
        "随意混用 db",
        "每条语句新建 DB"
      ],
      "answer": 0,
      "explanation": "使用 tx 才能确保操作属于同一事务。"
    },
    "fill": {
      "question": "全部写入成功后提交。",
      "snippet": "return tx.____()",
      "answers": [
        "Commit"
      ],
      "explanation": "Commit 原子提交事务，仍需要处理错误。"
    },
    "pitfall": "事务中混用 db 与 tx 会把部分操作放到事务之外；Commit 也可能失败，不能忽略返回错误。",
    "steps": [
      "BeginTx 后所有操作使用 tx",
      "原子性与隔离性不是同一概念",
      "先预测独立实验输出，再完成后端实战验收。"
    ],
    "code": "package main\n\nimport (\n    \"fmt\"\n)\n\n\n\nfunc main() {\n    balance := 10\n    pending := balance - {{n}}\n    auditOK := {{n}} % 2 == 1\n    if auditOK { balance = pending }\n    fmt.Println(\"提交:\", auditOK)\n    fmt.Println(\"余额:\", balance)\n}\n"
  },
  {
    "id": "pagination",
    "title": "分页、筛选、排序与索引",
    "group": "数据与数据库",
    "prerequisites": [
      "sql-query",
      "rest-crud"
    ],
    "description": "让集合查询有边界、有稳定顺序，并理解索引的作用。",
    "concepts": [
      [
        "分页必须有限",
        "limit 设默认值与最大值，offset 不可为负。SQL 同时限制 owner_id 与分页，不能先取全库再在 Go 中筛选；小集合可用 offset，大规模深分页可改为基于稳定键的游标。"
      ],
      [
        "稳定排序与白名单",
        "ORDER BY id 提供稳定顺序；同分值排序需要唯一键作为补充。客户端排序字段映射到固定 SQL 片段，禁止直接拼接原始输入，值继续用占位参数。"
      ],
      [
        "索引服务于查询形状",
        "毕业项目按 (owner_id,id) 查询任务，因此提供相应复合索引。用 EXPLAIN ANALYZE 观察真实执行计划；索引会增加写入与空间成本，不能盲目给所有字段建索引。"
      ]
    ],
    "lab": {
      "goal": "验证列表只返回当前用户的有限数据。",
      "steps": [
        "创建多个用户各自的任务。",
        "请求 /tasks?limit=2&offset=1，观察稳定次序。",
        "添加无效、负数或超上限的参数测试。"
      ],
      "acceptance": "最多返回约定条数；不会泄露其他用户任务；负数和超上限参数返回 400。",
      "source": "https://github.com/MU-ty/go-task-lab/blob/main/examples/task-api/sqlstore.go",
      "code": ""
    },
    "level": "后端",
    "parameter": true,
    "resources": [
      [
        "net/http 官方文档",
        "https://pkg.go.dev/net/http"
      ]
    ],
    "goals": [
      "让集合查询有边界、有稳定顺序，并理解索引的作用。",
      "验证列表只返回当前用户的有限数据。"
    ],
    "hint": "这是可在浏览器运行的独立实验；真实监听端口、数据库和部署请完成「后端实战」页签。",
    "challenge": "最多返回约定条数；不会泄露其他用户任务；负数和超上限参数返回 400。",
    "choice": {
      "question": "客户端传来的排序列名能否直接拼到 SQL？",
      "options": [
        "可以",
        "不可以，需要白名单",
        "只要长度短就可以"
      ],
      "answer": 1,
      "explanation": "占位参数不能替代 SQL 标识符，排序需映射到固定片段。"
    },
    "fill": {
      "question": "指定分页条数的 SQL 关键字。",
      "snippet": "SELECT id FROM tasks ORDER BY id ____ $1",
      "answers": [
        "LIMIT",
        "limit"
      ],
      "explanation": "LIMIT 限制结果条数。"
    },
    "pitfall": "没有稳定 ORDER BY 的分页不能保证一致次序。不要把原始排序输入直接拼接到 SQL。",
    "steps": [
      "分页必须有限",
      "稳定排序与白名单",
      "先预测独立实验输出，再完成后端实战验收。"
    ],
    "code": "package main\n\nimport (\n    \"fmt\"\n)\n\n\n\nfunc main() {\n    values := []int{1,2,3,4,5,6,7,8,9}\n    limit := {{n}}\n    if limit > 5 { limit = 5 }\n    offset := 2\n    end := offset + limit\n    if end > len(values) { end = len(values) }\n    fmt.Println(\"limit:\", limit)\n    fmt.Println(\"结果:\", values[offset:end])\n}\n"
  },
  {
    "id": "authentication",
    "title": "认证、随机会话与退出登录",
    "group": "认证与安全",
    "prerequisites": [
      "middleware",
      "sql-query"
    ],
    "description": "用高熵不透明 token 识别用户，并管理过期、撤销与存储。",
    "concepts": [
      [
        "认证证明你是谁",
        "注册保存用户，登录验证密码后生成会话，受保护请求用 Authorization: Bearer token。身份必须来自服务端认证结果，不能相信请求 Body 提交的 owner_id。"
      ],
      [
        "令牌来自密码学随机数",
        "用 crypto/rand 生成 32 字节随机 token 并编码，数据库只保存 SHA-256(token) 摘要。对高熵随机 token 求摘要可以用于查找；这与人类密码不能使用普通 SHA-256 的规则不同。"
      ],
      [
        "生命周期与传输",
        "会话有 expires_at，退出时删除服务端会话。生产用 HTTPS，不把 token 放进 URL、日志或 Git。毕业项目采用可撤销的不透明会话；JWT 需要额外处理校验算法、过期与撤销，不是自动更安全。"
      ]
    ],
    "parameter": false,
    "lab": {
      "goal": "完成注册、登录、访问和撤销会话。",
      "steps": [
        "POST /auth/register 后 POST /auth/login。",
        "用返回的 token 请求 /tasks。",
        "POST /auth/logout 后再次访问；测试过期会话。"
      ],
      "acceptance": "无 token、错误 token、撤销或过期 token 均为 401；数据库中看不到明文 token。",
      "source": "https://github.com/MU-ty/go-task-lab/blob/main/examples/task-api/auth.go",
      "code": ""
    },
    "resources": [
      [
        "OWASP 认证指南",
        "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html"
      ]
    ],
    "level": "后端",
    "goals": [
      "用高熵不透明 token 识别用户，并管理过期、撤销与存储。",
      "完成注册、登录、访问和撤销会话。"
    ],
    "hint": "这是可在浏览器运行的独立实验；真实监听端口、数据库和部署请完成「后端实战」页签。",
    "challenge": "无 token、错误 token、撤销或过期 token 均为 401；数据库中看不到明文 token。",
    "choice": {
      "question": "数据库中保存会话 token 的哪种形式？",
      "options": [
        "原文",
        "高熵 token 的摘要",
        "账号密码"
      ],
      "answer": 1,
      "explanation": "随机会话摘要用于查找，减少数据库泄漏后的直接使用风险。"
    },
    "fill": {
      "question": "使用密码学随机数填充 token。",
      "snippet": "_, err := rand.____(raw)",
      "answers": [
        "Read"
      ],
      "explanation": "crypto/rand.Read 生成密码学随机字节。"
    },
    "pitfall": "普通 SHA-256 适合这里的高熵随机 token 摘要，不适合存储人类密码。示例不会打印原始 token。",
    "steps": [
      "认证证明你是谁",
      "令牌来自密码学随机数",
      "先预测独立实验输出，再完成后端实战验收。"
    ],
    "code": "package main\n\nimport (\n    \"fmt\"\n    \"crypto/rand\"\n    \"crypto/sha256\"\n    \"encoding/base64\"\n)\n\n\n\nfunc main() {\n    raw := make([]byte, 32)\n    if _, err := rand.Read(raw); err != nil { panic(err) }\n    token := base64.RawURLEncoding.EncodeToString(raw)\n    digest := sha256.Sum256([]byte(token))\n    fmt.Println(\"随机字节:\", len(raw))\n    fmt.Println(\"令牌长度:\", len(token))\n    fmt.Println(\"存储摘要字节:\", len(digest))\n}\n"
  },
  {
    "id": "authorization",
    "title": "授权、资源归属与越权防护",
    "group": "认证与安全",
    "prerequisites": [
      "authentication"
    ],
    "description": "让用户只能操作属于自己的资源，并测试跨用户攻击。",
    "concepts": [
      [
        "认证成功仍需授权",
        "知道用户身份不代表能读取任意任务。每次获取、更新和删除都必须检查归属，列表也按用户范围过滤，不能只在前端隐藏按钮。"
      ],
      [
        "将归属写入查询条件",
        "SQL 直接用 WHERE owner_id=$1 AND id=$2。这样不会先返回别人的数据再检查，减少竞态和泄露；创建时从认证上下文赋予 owner，不接受客户端伪造拥有者。"
      ],
      [
        "403 与隐藏存在性的 404",
        "已认证但无权限可用 403；也可以统一返回 404 隐藏资源是否存在。毕业项目对其他用户的任务返回 404，合同与测试要一致；不能只凭 URL ID 难猜来保护资源。"
      ]
    ],
    "lab": {
      "goal": "以两个账号完成越权测试。",
      "steps": [
        "A 创建任务，B 使用自己的 token 请求同一 ID。",
        "分别测试 GET、PATCH、DELETE 和列表。",
        "检查 B 的 Body 即使伪造 owner_id 也不会改变归属。"
      ],
      "acceptance": "B 不能看见、修改或删除 A 的任务；A 数据保持不变；所有 CRUD 路径都有测试。",
      "source": "https://github.com/MU-ty/go-task-lab/blob/main/examples/task-api/api_test.go",
      "code": ""
    },
    "level": "后端",
    "parameter": true,
    "resources": [
      [
        "net/http 官方文档",
        "https://pkg.go.dev/net/http"
      ]
    ],
    "goals": [
      "让用户只能操作属于自己的资源，并测试跨用户攻击。",
      "以两个账号完成越权测试。"
    ],
    "hint": "这是可在浏览器运行的独立实验；真实监听端口、数据库和部署请完成「后端实战」页签。",
    "challenge": "B 不能看见、修改或删除 A 的任务；A 数据保持不变；所有 CRUD 路径都有测试。",
    "choice": {
      "question": "创建任务的 owner_id 应从哪里获得？",
      "options": [
        "客户端 Body",
        "认证后的服务端身份",
        "URL 随意输入"
      ],
      "answer": 1,
      "explanation": "客户端不能决定自己拥有谁的资源。"
    },
    "fill": {
      "question": "将归属限制写进 SQL。",
      "snippet": "WHERE owner_id = $1 ____ id = $2",
      "answers": [
        "AND",
        "and"
      ],
      "explanation": "归属与资源 ID 必须同时匹配。"
    },
    "pitfall": "前端隐藏按钮和难猜 ID 都不能防越权；每条获取、修改、删除与列表路径都要实施服务端归属检查。",
    "steps": [
      "认证成功仍需授权",
      "将归属写入查询条件",
      "先预测独立实验输出，再完成后端实战验收。"
    ],
    "code": "package main\n\nimport (\n    \"fmt\"\n    \"net/http\"\n    \"net/http/httptest\"\n)\n\n\n\nfunc main() {\n    owner := {{n}}\n    h := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {\n        if owner != 1 { http.NotFound(w,r); return }\n        fmt.Fprint(w,\"自己的任务\")\n    })\n    rec := httptest.NewRecorder()\n    h.ServeHTTP(rec,httptest.NewRequest(\"GET\",\"/tasks/1\",nil))\n    fmt.Println(\"用户 1 访问:\",rec.Code)\n}\n"
  },
  {
    "id": "password-storage",
    "title": "密码存储、Argon2id 与登录边界",
    "group": "认证与安全",
    "prerequisites": [
      "authentication"
    ],
    "description": "使用专用密码哈希，控制输入长度并建立一致的登录失败反馈。",
    "concepts": [
      [
        "密码不能用明文或普通快速哈希",
        "人类密码熵低，应使用带随机盐和成本参数的专用密码哈希。毕业项目使用 Argon2id，存储算法、版本、内存、迭代次数、并行度、盐和结果，验证时重新计算并比较。"
      ],
      [
        "成本与拒绝服务边界",
        "成本越高越难暴力破解，也会增加服务 CPU 与内存开销。项目固定有界参数，输入限长，并限制并发认证和速率。不要接受客户端提供任意高成本参数。"
      ],
      [
        "验证与业务反馈",
        "错误密码和不存在的账号使用一致的 401 信息，不输出密码或哈希。输入长度按字节与字符的不同约束明确处理；网站示例只验证长度，不进行密码哈希，真正实现见毕业项目。"
      ]
    ],
    "lab": {
      "goal": "测试 Argon2id 密码创建与验证。",
      "steps": [
        "阅读 password.go 的格式、随机盐和成本。",
        "同一密码生成两次，确认哈希不同却都能验证。",
        "错误密码、非法编码与超长密码测试都应安全失败。"
      ],
      "acceptance": "不存在明文或普通 SHA-256 密码存储；盐随机；登录日志无密码；并发验证有上限。",
      "source": "https://github.com/MU-ty/go-task-lab/blob/main/examples/task-api/password.go",
      "code": ""
    },
    "resources": [
      [
        "OWASP 密码存储",
        "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html"
      ],
      [
        "Go Argon2",
        "https://pkg.go.dev/golang.org/x/crypto/argon2"
      ]
    ],
    "level": "后端",
    "parameter": true,
    "goals": [
      "使用专用密码哈希，控制输入长度并建立一致的登录失败反馈。",
      "测试 Argon2id 密码创建与验证。"
    ],
    "hint": "这是可在浏览器运行的独立实验；真实监听端口、数据库和部署请完成「后端实战」页签。",
    "challenge": "不存在明文或普通 SHA-256 密码存储；盐随机；登录日志无密码；并发验证有上限。",
    "choice": {
      "question": "适合直接存储人类密码的方案是哪一个？",
      "options": [
        "明文",
        "普通 SHA-256",
        "带随机盐和成本的 Argon2id"
      ],
      "answer": 2,
      "explanation": "专用密码哈希抵抗低熵密码的离线猜测；随机 token 摘要是另一场景。"
    },
    "fill": {
      "question": "Argon2id 的标准 Go 函数名。",
      "snippet": "hash := argon2.____(password, salt, timeCost, memory, threads, 32)",
      "answers": [
        "IDKey"
      ],
      "explanation": "IDKey 实现 Argon2id。"
    },
    "pitfall": "本章浏览器程序只检查长度，没有执行密码哈希。真实 Argon2id 实现在毕业项目中，参数必须有界。",
    "steps": [
      "密码不能用明文或普通快速哈希",
      "成本与拒绝服务边界",
      "先预测独立实验输出，再完成后端实战验收。"
    ],
    "code": "package main\n\nimport (\n    \"fmt\"\n    \"unicode/utf8\"\n)\n\n\n\nfunc main() {\n    password := \"GoBackend!\" + fmt.Sprint({{n}})\n    chars := utf8.RuneCountInString(password)\n    valid := chars >= 12 && len(password) <= 128\n    fmt.Println(\"字符数:\",chars)\n    fmt.Println(\"长度合格:\",valid)\n}\n"
  },
  {
    "id": "cors-csrf",
    "title": "CORS、同源与 CSRF 的区别",
    "group": "认证与安全",
    "prerequisites": [
      "middleware",
      "authentication"
    ],
    "description": "正确限制浏览器跨源读取，并理解凭证携带方式对 CSRF 的影响。",
    "concepts": [
      [
        "CORS 是浏览器读权限",
        "跨源访问由浏览器执行 CORS 检查，服务端根据白名单 Origin 回应头与预检。它不是身份认证，也不能阻止 curl 或别的服务端调用 API。"
      ],
      [
        "Cookie 会自动携带",
        "Cookie 会话涉及 SameSite、Secure、HttpOnly 与 CSRF token/Origin 检查。使用 Authorization Bearer 时浏览器不会自动给攻击站附上你的 token，但 XSS 和 token 存储仍需防护。"
      ],
      [
        "源匹配必须准确",
        "比较解析后的确切 scheme、host、port，不能用 Contains(\"trusted.com\")。返回动态允许源时添加 Vary: Origin；带凭证的 CORS 不能用通配星号。毕业项目默认同源，没有默认开放全部跨域。"
      ]
    ],
    "parameter": false,
    "lab": {
      "goal": "明确 API 的浏览器接入策略。",
      "steps": [
        "保持毕业项目默认同源策略。",
        "如另有前端域名，显式增加确切源与预检测试。",
        "使用 curl 验证 Origin 拒绝路径，并解释它不替代认证。"
      ],
      "acceptance": "不存在反射任意 Origin 或带凭证通配；所有受保护端点仍需 token。",
      "source": "https://github.com/MU-ty/go-task-lab/blob/main/examples/task-api/api.go",
      "code": ""
    },
    "resources": [
      [
        "MDN CORS",
        "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS"
      ]
    ],
    "level": "后端",
    "goals": [
      "正确限制浏览器跨源读取，并理解凭证携带方式对 CSRF 的影响。",
      "明确 API 的浏览器接入策略。"
    ],
    "hint": "这是可在浏览器运行的独立实验；真实监听端口、数据库和部署请完成「后端实战」页签。",
    "challenge": "不存在反射任意 Origin 或带凭证通配；所有受保护端点仍需 token。",
    "choice": {
      "question": "CORS 是否可以替代 API 身份认证？",
      "options": [
        "可以",
        "不可以",
        "只有 curl 不用"
      ],
      "answer": 1,
      "explanation": "CORS 是浏览器跨源读权限，不验证用户身份。"
    },
    "fill": {
      "question": "让动态允许源响应被缓存正确区分。",
      "snippet": "w.Header().Add(\"____\", \"Origin\")",
      "answers": [
        "Vary"
      ],
      "explanation": "Vary: Origin 区分不同来源的响应。"
    },
    "pitfall": "CORS 不是认证机制。带凭证跨域不能使用通配允许源，域名子串比较也不可靠。",
    "steps": [
      "CORS 是浏览器读权限",
      "Cookie 会自动携带",
      "先预测独立实验输出，再完成后端实战验收。"
    ],
    "code": "package main\n\nimport (\n    \"fmt\"\n    \"net/http\"\n    \"net/http/httptest\"\n)\n\n\n\nfunc main() {\n    allowed := \"https://app.example.test\"\n    h := http.HandlerFunc(func(w http.ResponseWriter,r *http.Request){\n        if origin:=r.Header.Get(\"Origin\"); origin!=\"\" && origin!=allowed { http.Error(w,\"origin denied\",403); return }\n        w.WriteHeader(200)\n    })\n    for _, origin:=range []string{allowed,\"https://evil.example.test\"} {\n        req:=httptest.NewRequest(\"POST\",\"/tasks\",nil); req.Header.Set(\"Origin\",origin)\n        rec:=httptest.NewRecorder(); h.ServeHTTP(rec,req)\n        fmt.Println(origin,rec.Code)\n    }\n}\n"
  },
  {
    "id": "request-limits",
    "title": "输入限额、速率限制与安全边界",
    "group": "认证与安全",
    "prerequisites": [
      "http-json",
      "password-storage"
    ],
    "description": "控制请求体、分页、认证并发和请求速率，避免资源无边界增长。",
    "concepts": [
      [
        "资源预算从输入开始",
        "限制 Body 字节、标题字符、密码长度和分页上限；ReadHeaderTimeout 与 MaxHeaderBytes 限制头读取。不能先无限 ReadAll 再验证长度，那时资源已经消耗了。"
      ],
      [
        "限流与背压",
        "登录尝试按客户端地址限流，超过预算返回 429；密码验证再用有限并发槽位防止内存耗尽。多实例部署需要共享限流器；不能把任意 X-Forwarded-For 当真实 IP，除非来自受信代理。"
      ],
      [
        "安全失败与观察",
        "失败请求不改变状态，错误响应不暴露秘密，日志记录必要的原因与请求 ID。输入校验、参数化 SQL、认证、授权和限制是不同边界，彼此不能替代。"
      ]
    ],
    "lab": {
      "goal": "验证限制发生在业务写入之前。",
      "steps": [
        "发送超过 1 MiB 的请求，确认 413。",
        "连续尝试错误登录，确认 429 和 Retry-After。",
        "检查限流记录会清理过期地址，不能无限增长。"
      ],
      "acceptance": "请求体、认证速率与并发均有上限；拒绝路径没有数据库副作用；代理 IP 不被盲信。",
      "source": "https://github.com/MU-ty/go-task-lab/blob/main/examples/task-api/api_test.go",
      "code": ""
    },
    "level": "后端",
    "parameter": true,
    "resources": [
      [
        "net/http 官方文档",
        "https://pkg.go.dev/net/http"
      ]
    ],
    "goals": [
      "控制请求体、分页、认证并发和请求速率，避免资源无边界增长。",
      "验证限制发生在业务写入之前。"
    ],
    "hint": "这是可在浏览器运行的独立实验；真实监听端口、数据库和部署请完成「后端实战」页签。",
    "challenge": "请求体、认证速率与并发均有上限；拒绝路径没有数据库副作用；代理 IP 不被盲信。",
    "choice": {
      "question": "Body 超过约定大小应返回什么？",
      "options": [
        "200",
        "413",
        "204"
      ],
      "answer": 1,
      "explanation": "413 表示请求内容过大，拒绝应发生在业务写入之前。"
    },
    "fill": {
      "question": "为读取 Body 设置字节上限。",
      "snippet": "body := http.____(w, r.Body, 1<<20)",
      "answers": [
        "MaxBytesReader"
      ],
      "explanation": "MaxBytesReader 在读取过程中限制大小。"
    },
    "pitfall": "先无限读取 Body 再检查长度已经消耗了资源。反向代理头也不能未经信任配置就用于 IP 限流。",
    "steps": [
      "资源预算从输入开始",
      "限流与背压",
      "先预测独立实验输出，再完成后端实战验收。"
    ],
    "code": "package main\n\nimport (\n    \"fmt\"\n    \"io\"\n    \"net/http\"\n    \"net/http/httptest\"\n    \"strings\"\n)\n\n\n\nfunc main() {\n    rec:=httptest.NewRecorder()\n    req:=httptest.NewRequest(\"POST\",\"/\",strings.NewReader(\"data\"))\n    body:=http.MaxBytesReader(rec,req.Body,int64({{n}}))\n    defer body.Close()\n    _,err:=io.ReadAll(body)\n    status:=200\n    if err!=nil { status=413 }\n    fmt.Println(\"上限:\",{{n}})\n    fmt.Println(\"读取状态:\",status)\n}\n"
  },
  {
    "id": "structured-logging",
    "title": "结构化日志、请求 ID 与排错",
    "group": "测试与交付",
    "prerequisites": [
      "middleware"
    ],
    "description": "用 slog 记录可检索事件，让失败请求能被定位而不泄露秘密。",
    "concepts": [
      [
        "日志是事件与字段",
        "slog.JSONHandler 生成结构化记录，附带 method、path、status、duration 和 request_id。不要靠拼接长句解析数据，业务失败与系统故障区分级别。"
      ],
      [
        "请求 ID 贯穿边界",
        "由服务端生成或校验后接受，传到日志与响应头。用户可以提供错误信息和 ID，开发者据此关联处理过程；请求 ID 不作为权限凭证。"
      ],
      [
        "不要记录秘密",
        "Authorization、密码、完整数据库 DSN 与敏感 Body 不进入日志。记录必要元信息即可。项目对 URI 只记录路径，避免 query 中可能出现的秘密；生产日志有访问权限与保留策略。"
      ]
    ],
    "lab": {
      "goal": "从一个失败请求定位日志。",
      "steps": [
        "发送无效 JSON，查看响应的 X-Request-ID。",
        "找到相同 ID 的结构化日志。",
        "自动检查日志不包含已发送的密码与 token。"
      ],
      "acceptance": "能用 ID 找到状态与耗时；敏感头和 Body 未泄露。",
      "source": "https://github.com/MU-ty/go-task-lab/blob/main/examples/task-api/api.go",
      "code": ""
    },
    "resources": [
      [
        "log/slog",
        "https://pkg.go.dev/log/slog"
      ]
    ],
    "level": "后端",
    "parameter": true,
    "goals": [
      "用 slog 记录可检索事件，让失败请求能被定位而不泄露秘密。",
      "从一个失败请求定位日志。"
    ],
    "hint": "这是可在浏览器运行的独立实验；真实监听端口、数据库和部署请完成「后端实战」页签。",
    "challenge": "能用 ID 找到状态与耗时；敏感头和 Body 未泄露。",
    "choice": {
      "question": "请求日志应避免记录哪个字段？",
      "options": [
        "status",
        "request_id",
        "Authorization"
      ],
      "answer": 2,
      "explanation": "认证头含凭证，不能作为普通日志字段输出。"
    },
    "fill": {
      "question": "使用 Go 结构化日志包。",
      "snippet": "import \"log/____\"",
      "answers": [
        "slog"
      ],
      "explanation": "slog 支持带字段的结构化事件。"
    },
    "pitfall": "不要记录密码、Authorization 或完整 DSN。URL query 也可能含秘密，项目只记录路径。",
    "steps": [
      "日志是事件与字段",
      "请求 ID 贯穿边界",
      "先预测独立实验输出，再完成后端实战验收。"
    ],
    "code": "package main\n\nimport (\n    \"fmt\"\n    \"bytes\"\n    \"log/slog\"\n)\n\n\n\nfunc main() {\n    var logs bytes.Buffer\n    logger:=slog.New(slog.NewTextHandler(&logs,&slog.HandlerOptions{ReplaceAttr:func(groups []string,a slog.Attr)slog.Attr{\n        if a.Key==slog.TimeKey{return slog.Attr{}};return a\n    }}))\n    logger.Info(\"request\",\"method\",\"GET\",\"task_id\",{{n}},\"status\",200)\n    fmt.Print(logs.String())\n}\n"
  },
  {
    "id": "api-testing",
    "title": "API 合同测试、集成测试与 CI",
    "group": "测试与交付",
    "prerequisites": [
      "testing",
      "rest-crud",
      "authorization"
    ],
    "description": "从状态码到持久化，建立覆盖成功和失败路径的验证体系。",
    "concepts": [
      [
        "httptest 验证 HTTP 合同",
        "NewRecorder+ServeHTTP 检查状态、Content-Type、Location 与 JSON 内容。表驱动用例覆盖合法、未知字段、错误方法、未认证和越权，不只检查一个成功请求。"
      ],
      [
        "数据库集成测试验证真实语义",
        "内存实现不能替代 SQL 约束、事务和迁移测试。用独立测试数据库执行真实查询，隔离数据并限制清理范围；本项目 CI 启动 PostgreSQL 服务运行集成测试。"
      ],
      [
        "CI 是可重复的验收",
        "执行 gofmt、vet、go test -race、构建和数据库集成测试。race 只检查运行中实际触发的路径；失败即阻止宣称验证通过。对外服务通过可注入依赖测试，不依赖生产数据。"
      ]
    ],
    "parameter": false,
    "lab": {
      "goal": "运行毕业项目的完整测试链。",
      "steps": [
        "在项目目录执行 go test -race ./...。",
        "设置专用 TEST_DATABASE_URL 执行 SQL 集成测试。",
        "查看仓库 workflow 中 PostgreSQL 服务与测试结果。"
      ],
      "acceptance": "成功路径、输入错误、会话撤销、跨用户 CRUD、事务回滚都通过；日志不含秘密。",
      "source": "https://github.com/MU-ty/go-task-lab/blob/main/examples/task-api/api_test.go",
      "code": "go test -race ./...\n# 独立、可清理的测试数据库：\n# 设置 TEST_DATABASE_URL 后再运行\ngo test -race -run SQL -v ./..."
    },
    "level": "后端",
    "resources": [
      [
        "net/http 官方文档",
        "https://pkg.go.dev/net/http"
      ]
    ],
    "goals": [
      "从状态码到持久化，建立覆盖成功和失败路径的验证体系。",
      "运行毕业项目的完整测试链。"
    ],
    "hint": "这是可在浏览器运行的独立实验；真实监听端口、数据库和部署请完成「后端实战」页签。",
    "challenge": "成功路径、输入错误、会话撤销、跨用户 CRUD、事务回滚都通过；日志不含秘密。",
    "choice": {
      "question": "内存仓储测试能否替代真实 SQL 事务测试？",
      "options": [
        "可以",
        "不可以",
        "只要覆盖率高就可以"
      ],
      "answer": 1,
      "explanation": "SQL 约束、迁移与事务需要真实数据库验证。"
    },
    "fill": {
      "question": "在 HTTP 测试中记录响应。",
      "snippet": "rec := httptest.____()",
      "answers": [
        "NewRecorder"
      ],
      "explanation": "ResponseRecorder 捕获状态、头与正文。"
    },
    "pitfall": "缺少测试数据库时的 Skip 不算数据库测试通过；内存测试无法证明 SQL 事务与约束正确。",
    "steps": [
      "httptest 验证 HTTP 合同",
      "数据库集成测试验证真实语义",
      "先预测独立实验输出，再完成后端实战验收。"
    ],
    "code": "package main\n\nimport (\n    \"fmt\"\n    \"net/http\"\n    \"net/http/httptest\"\n)\n\n\n\nfunc main() {\n    h:=http.HandlerFunc(func(w http.ResponseWriter,r *http.Request){if r.Method!=\"GET\"{w.WriteHeader(405);return};w.WriteHeader(200)})\n    for _,tc:=range []struct{method string;want int}{{\"GET\",200},{\"POST\",405}}{\n        rec:=httptest.NewRecorder();h.ServeHTTP(rec,httptest.NewRequest(tc.method,\"/\",nil))\n        fmt.Println(tc.method,rec.Code==tc.want)\n    }\n}\n"
  },
  {
    "id": "health-observability",
    "title": "存活、就绪与服务观测",
    "group": "测试与交付",
    "prerequisites": [
      "sql-query",
      "structured-logging"
    ],
    "description": "区分进程存活与服务可接收请求，并建立可诊断的运行指标。",
    "concepts": [
      [
        "healthz 不等于 readyz",
        "存活探针只说明进程还能处理请求；就绪探针检查必需依赖是否可用。数据库不可用时让 readyz 返回 503，避免仍把流量送给无法服务的实例。"
      ],
      [
        "探针有自己的时间预算",
        "PingContext 应有短超时；不要在 healthz 中执行大量 SQL、登录或泄露配置。探针日志可降噪，故障原因记录在内部日志中。"
      ],
      [
        "从症状到原因",
        "关注请求量、错误率、延迟和资源使用，再与请求日志关联。pprof、调试和指标端点不应随意公开；先在受控环境压测，再确定连接池与并发预算。"
      ]
    ],
    "lab": {
      "goal": "演练数据库故障与恢复。",
      "steps": [
        "访问 healthz 与 readyz，确认正常 200。",
        "暂时停止开发数据库，观察 readyz 503、healthz 200。",
        "恢复数据库，观察就绪状态和日志。"
      ],
      "acceptance": "可用性状态正确，探针不泄露 DSN；依赖故障不会触发无界等待。",
      "source": "https://github.com/MU-ty/go-task-lab/blob/main/examples/task-api/cmd/api/main.go",
      "code": ""
    },
    "level": "后端",
    "parameter": true,
    "resources": [
      [
        "net/http 官方文档",
        "https://pkg.go.dev/net/http"
      ]
    ],
    "goals": [
      "区分进程存活与服务可接收请求，并建立可诊断的运行指标。",
      "演练数据库故障与恢复。"
    ],
    "hint": "这是可在浏览器运行的独立实验；真实监听端口、数据库和部署请完成「后端实战」页签。",
    "challenge": "可用性状态正确，探针不泄露 DSN；依赖故障不会触发无界等待。",
    "choice": {
      "question": "数据库故障时，readyz 的合理状态是？",
      "options": [
        "200",
        "503",
        "201"
      ],
      "answer": 1,
      "explanation": "依赖不可用意味着服务不应继续接收需要该依赖的流量。"
    },
    "fill": {
      "question": "检查真实数据库连接。",
      "snippet": "err := db.____(ctx)",
      "answers": [
        "PingContext"
      ],
      "explanation": "PingContext 使用有界上下文检查数据库。"
    },
    "pitfall": "端口可连接不代表业务就绪。项目还检查数据库迁移版本，不能把所有探针都写成固定 200。",
    "steps": [
      "healthz 不等于 readyz",
      "探针有自己的时间预算",
      "先预测独立实验输出，再完成后端实战验收。"
    ],
    "code": "package main\n\nimport (\n    \"fmt\"\n    \"net/http\"\n    \"net/http/httptest\"\n)\n\n\n\nfunc main() {\n    available:={{n}}%2==1\n    mux:=http.NewServeMux()\n    mux.HandleFunc(\"GET /healthz\",func(w http.ResponseWriter,r *http.Request){w.WriteHeader(200)})\n    mux.HandleFunc(\"GET /readyz\",func(w http.ResponseWriter,r *http.Request){if !available{w.WriteHeader(503);return};w.WriteHeader(200)})\n    for _,path:=range []string{\"/healthz\",\"/readyz\"}{rec:=httptest.NewRecorder();mux.ServeHTTP(rec,httptest.NewRequest(\"GET\",path,nil));fmt.Println(path,rec.Code)}\n}\n"
  },
  {
    "id": "graceful-shutdown",
    "title": "服务超时与优雅关闭",
    "group": "测试与交付",
    "prerequisites": [
      "request-context",
      "context"
    ],
    "description": "停止接收新请求，给正在处理的请求有限时间完成，再关闭依赖。",
    "concepts": [
      [
        "显式 http.Server 配置",
        "设置 ReadHeaderTimeout、ReadTimeout、WriteTimeout、IdleTimeout 和 MaxHeaderBytes。根据上传、长连接等场景调整，不把默认无界设置直接用于对公网的服务。"
      ],
      [
        "信号触发 Shutdown",
        "signal.NotifyContext 监听中断与终止。调用 Shutdown 使用独立、未取消的超时上下文，因为触发停止的上下文已经取消；等待退出后再关闭 DB。"
      ],
      [
        "超时与残余连接",
        "Shutdown 停止监听并等待活动 HTTP 请求，但不管理所有劫持连接或后台任务。超时后可 Close，并使自己启动的 worker 响应取消。把关闭顺序和错误写进测试或演练步骤。"
      ]
    ],
    "parameter": false,
    "lab": {
      "goal": "在真实服务中演练退出。",
      "steps": [
        "查看 main 中信号上下文、Server 和关闭顺序。",
        "开发环境启动慢请求，再发送 Ctrl+C。",
        "确保有关闭日志且不会无限等待，超时会关闭残余连接。"
      ],
      "acceptance": "关闭有最长时间；不会将已取消的上下文直接给 Shutdown；数据库最后关闭。",
      "source": "https://github.com/MU-ty/go-task-lab/blob/main/examples/task-api/cmd/api/main.go",
      "code": ""
    },
    "level": "后端",
    "resources": [
      [
        "net/http 官方文档",
        "https://pkg.go.dev/net/http"
      ]
    ],
    "goals": [
      "停止接收新请求，给正在处理的请求有限时间完成，再关闭依赖。",
      "在真实服务中演练退出。"
    ],
    "hint": "这是可在浏览器运行的独立实验；真实监听端口、数据库和部署请完成「后端实战」页签。",
    "challenge": "关闭有最长时间；不会将已取消的上下文直接给 Shutdown；数据库最后关闭。",
    "choice": {
      "question": "给 Shutdown 的上下文应该是哪一个？",
      "options": [
        "已经取消的信号 ctx",
        "独立的关闭超时 ctx",
        "nil"
      ],
      "answer": 1,
      "explanation": "信号 ctx 已取消，直接使用它无法给正在处理的请求留出等待时间。"
    },
    "fill": {
      "question": "优雅停止 HTTP Server。",
      "snippet": "err := server.____(shutdownCtx)",
      "answers": [
        "Shutdown"
      ],
      "explanation": "Shutdown 停止接收并等待活动请求。"
    },
    "pitfall": "触发退出的信号上下文已经取消，不能直接拿它等待 Shutdown；关闭数据库应在请求与维护任务结束之后。",
    "steps": [
      "显式 http.Server 配置",
      "信号触发 Shutdown",
      "先预测独立实验输出，再完成后端实战验收。"
    ],
    "code": "package main\n\nimport (\n    \"fmt\"\n    \"context\"\n    \"net/http\"\n    \"time\"\n)\n\n\n\nfunc main() {\n    server:=&http.Server{ReadHeaderTimeout:5*time.Second,IdleTimeout:60*time.Second}\n    ctx,cancel:=context.WithTimeout(context.Background(),time.Second)\n    defer cancel()\n    err:=server.Shutdown(ctx)\n    fmt.Println(\"请求头预算:\",server.ReadHeaderTimeout)\n    fmt.Println(\"未启动服务关闭:\",err==nil)\n}\n"
  },
  {
    "id": "docker-deploy",
    "title": "Docker、配置、HTTPS 与上线验收",
    "group": "测试与交付",
    "prerequisites": [
      "sql-migrations",
      "graceful-shutdown"
    ],
    "description": "构建非 root 运行镜像，连接数据库，并明确公网发布所需条件。",
    "concepts": [
      [
        "多阶段镜像只带运行产物",
        "构建阶段下载依赖并编译，运行阶段保留二进制与 CA 证书，以非 root 用户运行。Go 的纯 Go 依赖可用 CGO_ENABLED=0，镜像不应携带源码中的秘密或开发工具。"
      ],
      [
        "网络与数据生命周期",
        "Compose 中 API 连接 db 服务名，数据库使用持久卷。端口仅对需要的接口开放，开发数据库不直接暴露公网。迁移先于接入流量；备份和恢复演练不能被持久卷替代。"
      ],
      [
        "HTTPS、反向代理与发布",
        "公网经受信反向代理启用 HTTPS，设置准确的外部源与头策略，注入生产 DSN。Pages 仅托管学习网站，不能运行 Go API；毕业项目部署到支持进程或容器的服务器，按验收清单发布。"
      ]
    ],
    "lab": {
      "goal": "构建并运行带数据库的服务容器。",
      "steps": [
        "根据 README 复制开发 .env.example 并替换本地数据库密码。",
        "docker compose up -d db，执行一次 migrate，再启动 api。",
        "检查健康、注册登录、持久化与容器重启；公网另配置 TLS 和生产秘密。"
      ],
      "acceptance": "容器非 root；任务重启后仍存在；数据库不公开；API 通过 HTTPS 对外时认证与授权仍有效。",
      "source": "https://github.com/MU-ty/go-task-lab/blob/main/examples/task-api/compose.yaml",
      "code": "docker compose up -d db\ndocker compose run --rm api migrate\ndocker compose up -d api\ncurl http://127.0.0.1:8090/healthz"
    },
    "resources": [
      [
        "Docker Go 指南",
        "https://docs.docker.com/guides/golang/"
      ],
      [
        "发布、HTTPS 与备份恢复演练",
        "https://github.com/MU-ty/go-task-lab/blob/main/docs/DEPLOYMENT.md"
      ]
    ],
    "level": "后端",
    "parameter": true,
    "goals": [
      "构建非 root 运行镜像，连接数据库，并明确公网发布所需条件。",
      "构建并运行带数据库的服务容器。"
    ],
    "hint": "这是可在浏览器运行的独立实验；真实监听端口、数据库和部署请完成「后端实战」页签。",
    "challenge": "容器非 root；任务重启后仍存在；数据库不公开；API 通过 HTTPS 对外时认证与授权仍有效。",
    "choice": {
      "question": "GitHub Pages 能否运行毕业项目的 Go API 进程？",
      "options": [
        "能",
        "不能，需进程或容器服务器",
        "只需改端口"
      ],
      "answer": 1,
      "explanation": "Pages 托管静态学习网站；Go API、数据库需要实际后端环境。"
    },
    "fill": {
      "question": "构建不依赖 C 运行时的 Go 二进制。",
      "snippet": "____=0 go build -o api ./cmd/api",
      "answers": [
        "CGO_ENABLED"
      ],
      "explanation": "纯 Go 构建可关闭 CGO。"
    },
    "pitfall": "GitHub Pages 只能托管静态学习网站。真实 API 与数据库需要进程或容器环境；开发 Compose 不直接对公网开放。",
    "steps": [
      "多阶段镜像只带运行产物",
      "网络与数据生命周期",
      "先预测独立实验输出，再完成后端实战验收。"
    ],
    "code": "package main\n\nimport (\n    \"fmt\"\n    \"net\"\n    \"strconv\"\n)\n\n\n\nfunc main() {\n    addr:=net.JoinHostPort(\"0.0.0.0\",strconv.Itoa(8000+{{n}}))\n    fmt.Println(\"容器监听:\",addr)\n    fmt.Println(\"开发健康路径: /healthz\")\n}\n"
  },
  {
    "id": "backend-capstone",
    "title": "毕业项目：独立交付任务 API",
    "group": "毕业项目",
    "prerequisites": [
      "docker-deploy",
      "api-testing"
    ],
    "description": "从需求到部署完整交付一个多用户任务服务，用可验证结果检验能力。",
    "concepts": [
      [
        "交付物是能工作的服务",
        "明确接口合同、目录职责、迁移、配置、测试和运行文档。用户注册登录后，只能管理自己的任务；项目同时提供内存学习模式与 PostgreSQL 持久化模式。"
      ],
      [
        "先独立实现，再对照参考",
        "按后端实战的阶段任务从空目录实现，不先复制整个答案。每阶段用 curl 和测试验收，再对照参考项目差异；可以解释每条 SQL、每个状态码与每个失败路径才算理解。"
      ],
      [
        "完成标准覆盖失败与运维",
        "验收不仅是创建成功：还要验证输入拒绝、越权失败、会话撤销、事务回滚、重启持久化、依赖故障与正常退出。下一步可扩展游标分页、幂等键、缓存和后台任务，但先确保当前合同可靠。"
      ]
    ],
    "parameter": false,
    "hint": "此处只是进程内 API 流程与演示 token，不具有真正的认证和持久化。完整服务使用 Argon2id、随机会话和 PostgreSQL。",
    "lab": {
      "goal": "独立实现并交付完整任务 API。",
      "steps": [
        "阶段 A（21–28）：HTTP、严格 JSON、CRUD、超时；交付接口合同与请求测试。",
        "阶段 B（29–33）：Store 接口、PostgreSQL、迁移、事务和分页；交付重启仍存在的数据。",
        "阶段 C（34–38）：密码、会话与用户隔离；交付注册登录、退出与越权测试。",
        "阶段 D（39–43）：结构化日志、CI、探针、优雅关闭和容器；交付运行手册与发布演练。",
        "参考 docs/BACKEND.md 的最终验收清单逐项验证，并向他人解释关键取舍。"
      ],
      "acceptance": "从空目录实现；全部测试通过；两账号隔离、会话撤销、事务回滚、重启持久化、故障探针与容器启动均能复现。",
      "source": "https://github.com/MU-ty/go-task-lab/blob/main/examples/task-api/README.md",
      "code": ""
    },
    "level": "后端",
    "resources": [
      [
        "net/http 官方文档",
        "https://pkg.go.dev/net/http"
      ]
    ],
    "goals": [
      "从需求到部署完整交付一个多用户任务服务，用可验证结果检验能力。",
      "独立实现并交付完整任务 API。"
    ],
    "challenge": "从空目录实现；全部测试通过；两账号隔离、会话撤销、事务回滚、重启持久化、故障探针与容器启动均能复现。",
    "choice": {
      "question": "哪一项才算完成毕业项目？",
      "options": [
        "一次 POST 成功",
        "能解释并复现合同、失败路径、权限、持久化和部署验收",
        "代码行数多"
      ],
      "answer": 1,
      "explanation": "后端能力体现为可靠、可测试、可运行的交付，而非仅一条成功请求。"
    },
    "fill": {
      "question": "运行项目所有包的测试。",
      "snippet": "go test ____",
      "answers": [
        "./..."
      ],
      "explanation": "./... 包含当前模块及其子包。"
    },
    "pitfall": "复制参考答案并看到一次成功请求，不等于能独立交付。需要解释失败路径并复现权限、事务和部署验收。",
    "steps": [
      "交付物是能工作的服务",
      "先独立实现，再对照参考",
      "先预测独立实验输出，再完成后端实战验收。"
    ],
    "code": "package main\n\nimport (\n    \"fmt\"\n    \"net/http\"\n    \"net/http/httptest\"\n    \"strings\"\n)\n\n\n\nfunc main() {\n    tasks:=map[string]string{}\n    mux:=http.NewServeMux()\n    mux.HandleFunc(\"POST /tasks\",func(w http.ResponseWriter,r *http.Request){tasks[\"1\"]=\"学习 Go 后端\";w.Header().Set(\"Location\",\"/tasks/1\");w.WriteHeader(201)})\n    mux.HandleFunc(\"GET /tasks/{id}\",func(w http.ResponseWriter,r *http.Request){title,ok:=tasks[r.PathValue(\"id\")];if !ok{http.NotFound(w,r);return};fmt.Fprint(w,title)})\n    protected:=http.HandlerFunc(func(w http.ResponseWriter,r *http.Request){if !strings.HasPrefix(r.Header.Get(\"Authorization\"),\"Bearer demo-\"){w.WriteHeader(401);return};mux.ServeHTTP(w,r)})\n    for _,method:=range []string{\"POST\",\"GET\"}{path:=\"/tasks\";if method==\"GET\"{path=\"/tasks/1\"};req:=httptest.NewRequest(method,path,nil);req.Header.Set(\"Authorization\",\"Bearer demo-token\");rec:=httptest.NewRecorder();protected.ServeHTTP(rec,req);fmt.Println(method,rec.Code)}\n    denied:=httptest.NewRecorder();protected.ServeHTTP(denied,httptest.NewRequest(\"GET\",\"/tasks/1\",nil));fmt.Println(\"未认证:\",denied.Code)\n}\n"
  }
]);
