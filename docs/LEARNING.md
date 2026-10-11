# 用这个项目学习 Go

## 1. 先运行，再阅读入口

先执行 README 的新增、完成、统计命令。读 `cmd/task/main.go`，观察参数怎样从 `os.Args[1:]` 流入 `run`，又通过 `switch` 进入业务方法。

`package main` 是可执行程序的包，`func main()` 是入口。其他包的大写名称可以导出，小写名称只在包内可用。`internal` 目录限制其包只能在所在项目树内导入。

`:=` 同时声明和赋值，适用于函数体；`var` 可以不提供初始值，Go 会给零值；`const` 声明常量。`bool` 零值为 false，`int` 为 0，`string` 为空串。

`file := flags.String(...)` 的类型是 `*string`，读取内容使用 `*file`。`&storage.JSONFile{...}` 取得结构体地址。这里的指针不是 C 风格指针运算。

练习：给帮助信息增加一行作者说明，再运行 `go run ./cmd/task help`。

## 2. 函数与错误

`Add(title string) (Task, error)` 返回两个值。成功时 error 为 nil；失败时返回零值 Task 和错误。调用者用 `if err != nil` 决定是否继续。不要忽略存储错误。

`if err := ...; err != nil` 中 err 的作用域仅覆盖这个 if 语句。`fmt.Errorf("读取文件: %w", err)` 给错误补充上下文，并保留原始错误，调用方可用 `errors.Is` 判断。

练习：输入 `done abc`、空标题和不存在的 ID，观察错误与退出码；在 PowerShell 中读取 `$LASTEXITCODE`。

## 3. 结构体、方法与指针接收者

`Task` 将 ID、标题、完成状态组合成一个值。`Task{ID: 1, Title: "学习"}` 是结构体字面量。字段后面的反引号是标签，JSON 库读取它决定文件里的字段名。

`func (s *Service) Add(...)` 是 Service 的方法；`s` 是接收者，`*Service` 是指针类型。指针接收者可以修改原对象，也避免复制整个结构体。这里 Service 持有 Repository，方法通过它操作数据。

练习：增加 `Priority int` 字段；旧 JSON 缺少该字段时会得到 0。先只展示优先级，再添加设置命令并验证合法范围。

## 4. 切片与循环

`[]Task` 是切片，长度可变。`make([]Task, 0)` 创建空切片，`append` 返回新的切片描述符，所以需要接住返回值。`tasks[:i]` 不包含 i，`tasks[i+1:]` 从下一个元素开始；结尾的 `...` 把切片展开为可变参数。

`for _, t := range tasks` 遍历元素，`_` 忽略索引。t 是当前元素的副本，给 t.Done 赋值不会改原切片。Complete 使用 `tasks[i].Done = true` 修改真正的元素。

练习：新增一个 `search 关键词` 命令，用 `strings.Contains` 过滤标题，给它补充中文匹配测试。

## 5. map 与接口

`map[string]int` 用字符串做键、整数做值。Stats 用它维护三类计数。读取不存在的键得到值类型的零值；用 `value, ok := m[key]` 可区分不存在和零值。

Repository 只要求 Load、Save 两个方法。JSONFile 没有 implements 关键字；方法集合满足要求就自动实现接口。测试里的 memoryRepo 也实现同一接口，因此测试业务逻辑无需碰文件。

练习：增加一个只存在内存中的存储类型，运行同样的业务测试；解释为什么 New 不必知道它的具体类型。

## 6. JSON 和测试

`json.Unmarshal(data, &tasks)` 需要指针，才能把解码结果写回 tasks。`json.MarshalIndent` 将切片编码为便于阅读的 JSON。读取不存在的文件视为首次使用；损坏文件直接报错，不自动覆盖。

测试文件以 `_test.go` 结尾，测试函数以 Test 开头并接收 `*testing.T`。`t.TempDir()` 创建自动清理的临时目录。CLI 测试用 bytes.Buffer 捕获输出，验证完整命令流程。

练习：把 JSON 文件改成错误内容，确认 add 命令失败且文件内容没有变化；再为 Save 的写入失败添加测试。

## 7. 并发入门

执行 `go run ./examples/concurrency`。`go func() { ... }()` 启动 goroutine；channel 在 goroutine 之间传递整数；`range jobs` 在 jobs 关闭且数据读完后结束。

两个 worker 计算平方并发送结果。发送任务、等待 worker 都在独立 goroutine 中执行，主 goroutine 持续接收结果，避免互相等待。所有 worker 完成后关闭 results；主程序读完结果计算出 55。

`defer wg.Done()` 在 worker 返回前执行；`wg.Add(1)` 必须先于启动 worker。channel 应由负责发送并知道发送完成的一方关闭，不要由接收者任意关闭。

练习：改成 3 个 worker，分别打印中间结果，观察顺序变化；尝试把 jobs 发送移到主 goroutine、放在消费 results 之前，分析为何可能死锁。

## 8. 下一阶段

1. 增加 edit 命令及不存在 ID 的测试。
2. 增加时间字段，学习 time.Time 和时间格式。
3. 用 sort.Slice 排序列表，学习匿名函数。
4. 增加 HTTP API，学习 net/http、状态码和请求校验。
5. 改进保存：同目录临时文件、关闭文件、替换目标文件，研究 Windows 与 Unix 的差异。

每次改动先写下输入和期望输出，然后实现、测试并提交一次 Git commit。
