// 课程内容独立于界面；{{n}} 会替换成学习者选择的参数。
const program = (body, imports = '"fmt"', declarations = '') => `package main\n\nimport ${imports}\n${declarations}\nfunc main() {\n${body}\n}\n`;
const COURSES = [
{id:'hello',title:'第一个 Go 程序',group:'基础入门',level:'入门',description:'认识程序入口、包和导入，写下第一句 Hello, Go。',concepts:[['package：代码属于哪个包','每个 Go 文件以 package 声明开头。可执行程序使用 package main；同一目录中的普通 Go 文件属于同一个包。'],['import：引入标准库','import "fmt" 引入格式化输入输出包。fmt.Println 中的包名告诉 Go，这个函数来自哪里。'],['main：程序从这里开始','func main() 是可执行程序入口，不接收参数，也不返回值。花括号包住函数体，语句按顺序执行。']],pitfall:'Go 不允许未使用的导入。引入 fmt 却没有使用它，会编译失败。',code:program('    fmt.Println("Hello, Go!")'),hint:'这一章没有可变参数，重点是理解程序的骨架。',parameter:false,steps:['package main 声明可执行程序。','import "fmt" 使我们能够输出文字。','Println 输出字符串，末尾自动换行。'],choice:{question:'Go 可执行程序的入口是哪一个？',options:['func start()','func main()','package fmt'],answer:1,explanation:'main 包中的 func main() 是入口。package 声明包，不是函数调用。'},fill:{question:'补全标准库包名，让程序可以输出文字。',snippet:'import "____"\nfunc main() {\n    fmt.Println("Hello, Go!")\n}',answers:['fmt'],explanation:'fmt 提供 Print、Printf、Println 等格式化输出函数。'}},
{id:'variables',title:'变量、常量与类型',group:'基础入门',level:'入门',description:'用 var、:= 和 const 表达数据，理解类型与零值。',concepts:[['var：声明与零值','var language string = "Go" 显式指定类型。未初始化时，int 为 0，bool 为 false，string 为空字符串。'],[':=：简短声明','count := 3 声明并赋值，类型从右侧表达式推断。:= 只能用于函数体，普通重新赋值使用 =。'],['const：编译期常量','const target = 10 定义不可重新赋值的常量。Go 是静态类型语言，int 与 string 不能直接相加。']],pitfall:':= 在同一作用域至少需要一个新变量。已有变量的普通赋值写 count = 4。',code:program('    count := {{n}}\n    var language string = "Go"\n    const target = 10\n    fmt.Println(language, count, target-count)'),hint:'调整 n，观察数量与剩余数量如何变化。',steps:['count 推断为 int。','language 是 string，target 是常量。','Println 用空格分隔多个参数。'],choice:{question:'var ready bool 未赋初始值时，ready 是什么？',options:['true','nil','false'],answer:2,explanation:'bool 的零值是 false。nil 适用于指针、切片、map 等类型。'},fill:{question:'用简短声明把 count 初始化为 3。',snippet:'count ____ 3\nfmt.Println(count)',answers:[':='],explanation:':= 同时声明和赋值；= 给已经声明的变量赋值。'}},
{id:'conditions',title:'条件判断',group:'基础入门',level:'入门',description:'让程序根据条件选择不同的执行路径。',concepts:[['if：条件必须为 bool','if score >= 60 使用比较得到的布尔值。条件不需要圆括号，但花括号始终必需。'],['else：另一条路径','if 条件不成立时执行 else。else 与前一个右花括号写在同一行，避免自动分号插入问题。'],['switch：多个分支','switch 可表达多个 case，默认执行后退出，不用写 break。没有表达式的 switch 可比较布尔条件。']],pitfall:'数字和字符串不会隐式转为 bool。if 1 不合法，必须明确比较。',code:program('    score := {{n}} * 10\n    if score >= 60 {\n        fmt.Println("通过", score)\n    } else {\n        fmt.Println("继续练习", score)\n    }'),hint:'把 n 改为 6，观察程序选择哪个分支。',steps:['score 为 n 乘以 10。','>= 比较得到 bool。','两个 Println 只执行其中一个。'],choice:{question:'哪个 if 条件合法？',options:['if 1 { ... }','if score >= 60 { ... }','if "Go" { ... }'],answer:1,explanation:'if 要求布尔值。score >= 60 产生 bool，而数字和字符串不能充当条件。'},fill:{question:'判断 score 大于或等于 60。',snippet:'if score ____ 60 {\n    fmt.Println("通过")\n}',answers:['>='],explanation:'>= 包含恰好等于 60 的情况。'}},
{id:'loops',title:'for 循环',group:'基础入门',level:'入门',description:'重复执行语句，计算 1 到 n 的总和。',concepts:[['三段式循环','for i := 1; i <= n; i++ 分别是初始化、条件和每轮末尾的更新。条件不成立时退出。'],['只有 for，没有 while','for condition { ... } 表达条件循环。for { ... } 是无限循环，可通过 break 结束。'],['累加与更新','sum += i 等价于 sum = sum + i。i++ 是语句，不能作为值传入函数。']],pitfall:'i <= n 包含 n；i < n 不包含 n。边界条件决定循环次数。',code:program('    n := {{n}}\n    sum := 0\n    for i := 1; i <= n; i++ {\n        sum += i\n    }\n    fmt.Println("总和:", sum)'),hint:'n=3 时分别累加 1、2、3；先算出答案再运行。',steps:['sum 初始化为 0。','检查 i <= n，执行累加，再执行 i++。','退出循环后打印总和。'],choice:{question:'for i := 0; i < 3; i++ 循环体执行几次？',options:['2 次','3 次','4 次'],answer:1,explanation:'i 为 0、1、2 时条件成立，i=3 时退出，共三次。'},fill:{question:'每轮把 i 累加到 sum。',snippet:'for i := 1; i <= n; i++ {\n    sum ____ i\n}',answers:['+='],explanation:'+= 是累加赋值运算符。'}},
{id:'functions',title:'函数与错误处理',group:'数据与抽象',level:'基础',description:'拆分逻辑，用多返回值同时表达结果和错误。',concepts:[['函数签名','func add(a, b int) (int, error) 接收两个 int，返回 int 与 error。相邻参数同类型时可合并类型。'],['多个返回值','result, err := add(3, 2) 接收结果与错误。Go 通常通过 error 返回常规错误。'],['nil 与错误检查','成功返回结果与 nil。if err != nil 表示失败，调用者应处理错误，再决定是否继续。']],pitfall:'不要忽略 err。错误处理决定程序收到不合法输入时如何表现。',code:program('    result, err := add({{n}}, 2)\n    if err != nil {\n        fmt.Println(err)\n        return\n    }\n    fmt.Println(result)','"fmt"','\nfunc add(a, b int) (int, error) {\n    if a < 0 || b < 0 {\n        return 0, fmt.Errorf("不能为负数")\n    }\n    return a + b, nil\n}\n'),hint:'调整第一个参数。合法参数不会触发错误分支；可复制到本机，尝试负数。',steps:['add 校验负数，再返回求和结果。','调用方接收 result 和 err。','错误不为 nil 时返回，否则打印结果。'],choice:{question:'返回 error 的函数，通常哪个值表示成功？',options:['nil','true','0'],answer:0,explanation:'nil 通常表示没有错误，true 和 0 不是 error 的成功约定。'},fill:{question:'只在有错误时进入分支。',snippet:'result, err := add(3, 2)\nif err ____ nil {\n    fmt.Println(err)\n}',answers:['!='],explanation:'err != nil 表示有错误；err == nil 表示成功。'}},
{id:'slices',title:'切片与 range',group:'数据与抽象',level:'基础',description:'组织一组数据，理解 append 和遍历。',concepts:[['切片：可变长度序列','[]int{1, 2} 创建整数切片。len 返回长度。切片引用底层数组，多个切片可能共享底层数据。'],['append：接住返回值','nums = append(nums, 3) 追加元素。append 可能分配新数组，所以需要接收返回的切片。'],['range：索引和值','for i, value := range nums 返回索引与值。用 _ 忽略不需要的值；结构体循环变量是元素副本。']],pitfall:'修改 range 得到的结构体副本不会修改原元素。修改原元素应使用切片索引。',code:program('    nums := []int{1, 2}\n    nums = append(nums, {{n}})\n    for i, value := range nums {\n        fmt.Println(i, value)\n    }'),hint:'每行输出索引与元素，索引从 0 开始。',steps:['初始切片包含两个元素。','append 返回追加后的切片。','range 逐项返回索引与值。'],choice:{question:'向 nums 追加元素，哪个写法正确？',options:['nums = append(nums, 3)','nums.append(3)','append(nums, 3) 后无需接收结果'],answer:0,explanation:'append 是内置函数，需要接收返回值，才能正确使用更新后的切片。'},fill:{question:'不需要索引时填入占位标识符。',snippet:'for ____, value := range nums {\n    fmt.Println(value)\n}',answers:['_'],explanation:'空白标识符 _ 忽略不需要的值。'}},
{id:'maps',title:'map 键值映射',group:'数据与抽象',level:'基础',description:'按键查找数据，区分不存在和零值。',concepts:[['map：按键查找','map[string]int 使用字符串键和整数值。字面量同时创建和初始化 map。'],['value, ok：判断存在','value, ok := scores["Go"] 得到值和存在标志。不存在的键返回值类型的零值。'],['delete 与 len','delete 删除键，不存在时不报错。len 返回 map 中的键值对数量。']],pitfall:'map 遍历顺序不保证。nil map 可以读取，但写入会 panic，写入前用 make 或字面量初始化。',code:program('    scores := map[string]int{"Go": {{n}}, "SQL": 2}\n    value, ok := scores["Go"]\n    fmt.Println(value, ok)\n    delete(scores, "SQL")\n    fmt.Println(len(scores))'),hint:'先读取 Go 分数，再删除 SQL，最后输出剩余键的数量。',steps:['创建两个键值对。','comma-ok 模式得到 Go 的值和 true。','删除 SQL 后 map 长度为 1。'],choice:{question:'读取不存在的 int 值键，value, ok 的结果是？',options:['nil, true','0, false','发生 panic'],answer:1,explanation:'不存在的键返回值类型零值与 false。读取是安全的。'},fill:{question:'删除 scores 中的 SQL 键。',snippet:'____(scores, "SQL")',answers:['delete'],explanation:'delete 是内置函数，删除不存在的键不会报错。'}},
{id:'structs',title:'结构体与指针',group:'数据与抽象',level:'基础',description:'组合相关字段，通过指针修改原值。',concepts:[['struct：组合字段','type User struct { Name string; Age int } 定义新类型，User{Name: "小 Go", Age: 3} 创建值。'],['&：取地址','p := &u 得到指向 u 的指针。通过 p 修改字段会影响原值；把结构体赋值给另一个变量则会复制。'],['字段访问','p.Age 等价于 (*p).Age。Go 允许指针直接访问结构体字段，一般解引用使用 *p。']],pitfall:'nil 指针没有指向有效对象，解引用会 panic。必要时先检查是否为 nil。',code:program('    u := User{Name: "小 Go", Age: {{n}}}\n    p := &u\n    p.Age++\n    fmt.Println(u.Name, u.Age)','"fmt"','\ntype User struct {\n    Name string\n    Age int\n}\n'),hint:'通过 p 修改年龄，最后打印的是原变量 u。',steps:['创建 User 值。','&u 获取地址。','p.Age++ 修改原对象，年龄增加 1。'],choice:{question:'p := &u 后执行 p.Age++，u.Age 会怎样？',options:['保持不变','增加 1','一定编译失败'],answer:1,explanation:'p 指向 u，修改指向对象的 Age 就是修改 u.Age。'},fill:{question:'让 p 指向 u。',snippet:'p := ____u\np.Age++',answers:['&'],explanation:'& 取地址，* 解引用。'}},
{id:'interfaces',title:'方法与接口',group:'进阶起步',level:'进阶',description:'给类型添加行为，用接口描述“能做什么”。',concepts:[['方法：带接收者的函数','func (u User) Greeting() string 为 User 定义方法。值接收者得到副本，需要修改原值时常用指针接收者。'],['接口：行为约定','Speaker 接口只要求 Greeting() string 方法。调用者无需知道具体类型的字段。'],['隐式实现','类型的方法集合满足接口就自动实现它，无需 implements。接口变量可以持有满足要求的具体值。']],pitfall:'User 与 *User 的方法集合不同。若只有指针接收者的方法，通常只有 *User 满足对应接口。',code:program('    var s Speaker = User{Name: "小 Go"}\n    fmt.Println(s.Greeting())','"fmt"','\ntype User struct { Name string }\nfunc (u User) Greeting() string {\n    return "你好，" + u.Name\n}\ntype Speaker interface {\n    Greeting() string\n}\n'),parameter:false,hint:'没有可变参数，重点是接口如何调用具体类型的方法。',steps:['User.Greeting 返回问候语。','Speaker 约定 Greeting 的签名。','User 自动满足接口，s 调用具体实现。'],choice:{question:'Go 类型如何实现接口？',options:['必须写 implements','方法集合满足接口即可','必须继承一个类'],answer:1,explanation:'Go 使用隐式实现，方法名、参数和返回值必须满足要求。'},fill:{question:'补全定义接口的关键字。',snippet:'type Speaker ____ {\n    Greeting() string\n}',answers:['interface'],explanation:'interface 定义方法集合，struct 定义字段。'}},
{id:'concurrency',title:'goroutine 与 channel',group:'进阶起步',level:'进阶',description:'并发计算，通过 channel 汇总结果。',concepts:[['go：启动并发函数','go func(value int) { ... }(i) 启动 goroutine。把 i 作为参数传入，每个计算拿到独立输入。'],['channel：传递结果','make(chan int) 创建无缓冲 channel。results <- value 发送，range results 接收直到 channel 关闭且数据读完。'],['WaitGroup 与 defer','启动前 Add(1)，返回前 defer Done()，Wait() 等待所有工作结束，再关闭 results。']],pitfall:'不能在主 goroutine 先 Wait 再接收无缓冲 channel，发送者与主程序互相等待会死锁。',code:program('    n := {{n}}\n    results := make(chan int)\n    var wg sync.WaitGroup\n    for i := 1; i <= n; i++ {\n        wg.Add(1)\n        go func(value int) {\n            defer wg.Done()\n            results <- value * value\n        }(i)\n    }\n    go func() {\n        wg.Wait()\n        close(results)\n    }()\n    sum := 0\n    for value := range results {\n        sum += value\n    }\n    fmt.Println("平方和:", sum)','(\n    "fmt"\n    "sync"\n)'),hint:'n=3 计算 1²+2²+3²。结果到达顺序不保证，但总和固定。',steps:['每个 goroutine 计算一个平方。','主 goroutine 同时接收并累加，避免阻塞。','等待全部工作完成后关闭 channel。'],choice:{question:'哪个关键字启动 goroutine？',options:['async','thread','go'],answer:2,explanation:'go 后跟函数调用，使调用在新的 goroutine 中并发执行。'},fill:{question:'让 Done 在 goroutine 返回前执行。',snippet:'go func(value int) {\n    ____ wg.Done()\n    results <- value * value\n}(i)',answers:['defer'],explanation:'defer 把操作延迟到当前函数返回时执行。'}}
];

// 进阶课程：自由修改可在 OneCompiler 中运行。
COURSES.push(...[
  {
    "id": "closures",
    "title": "闭包、函数值与可变参数",
    "group": "语言深入",
    "level": "进阶",
    "description": "把函数当作值传递，让闭包保留状态，用 ... 接收多个参数。",
    "concepts": [
      [
        "函数也是值",
        "func(int) int 是一种函数类型，可以赋值给变量、作为参数或返回值。调用时仍需遵守参数与返回值类型；nil 函数值不能被调用。"
      ],
      [
        "闭包捕获的是变量",
        "返回的匿名函数引用外层 total，外层调用结束后仍能访问它。同一个闭包的多次调用共享状态；再次调用 counter 会产生独立的 total。闭包共享状态本身不提供并发保护。"
      ],
      [
        "可变参数与切片展开",
        "values ...int 必须是最后一个形参，在函数内表现为 []int。调用 add(1, 2) 传多个值，调用 add(values...) 将切片展开；不能把未展开的 []int 当作 int 参数。"
      ]
    ],
    "pitfall": "闭包与捕获变量共享状态。若让多个 goroutine 同时调用这里的 add，total 会出现数据竞争，需要锁或其他同步方式。",
    "code": "package main\n\nimport \"fmt\"\n\nfunc counter(start int) func(...int) int {\n    total := start\n    return func(values ...int) int {\n        for _, value := range values {\n            total += value\n        }\n        return total\n    }\n}\n\nfunc main() {\n    add := counter({{n}})\n    fmt.Println(add(1, 2))\n    values := []int{3, 4}\n    fmt.Println(add(values...))\n}\n",
    "hint": "第二次调用沿用第一次累加后的 total，不会重新从 n 开始。",
    "steps": [
      "counter(n) 返回带有状态的函数。",
      "第一次添加 1、2，得到 n+3。",
      "第二次展开切片并添加 3、4，得到 n+10。"
    ],
    "choice": {
      "question": "连续调用同一个 add 闭包时，total 会怎样？",
      "options": [
        "每次重置为 start",
        "保留之前累加的值",
        "调用结束就无法访问"
      ],
      "answer": 1,
      "explanation": "闭包引用外层变量，同一个闭包会继续使用同一份 total。"
    },
    "fill": {
      "question": "把 values 切片展开后传入 add。",
      "snippet": "values := []int{3, 4}\nfmt.Println(add(values____))",
      "answers": [
        "..."
      ],
      "explanation": "调用末尾的 ... 把切片作为可变参数传入。"
    },
    "challenge": "创建 a := counter(0) 与 b := counter(10)，交替调用并预测输出。再调用 a()，观察没有参数时状态是否改变。",
    "resources": [
      [
        "Go 函数与闭包",
        "https://go.dev/tour/moretypes/25"
      ]
    ]
  },
  {
    "id": "defer",
    "title": "defer、panic 与 recover",
    "group": "语言深入",
    "level": "进阶",
    "description": "理解延迟执行的顺序、参数求值时机，以及异常恢复的边界。",
    "concepts": [
      [
        "defer：返回前执行，后注册先执行",
        "defer 将函数调用安排到当前函数返回时执行，多个调用按逆序执行。文件关闭、解锁等清理可以放在 defer 中，但循环内注册的 defer 仍等到所属函数返回才执行。"
      ],
      [
        "参数立即求值，函数体稍后执行",
        "defer fmt.Println(n) 在注册时保存 n 的值；defer func() { fmt.Println(n) }() 在执行函数体时读取捕获变量。两种写法会因之后的赋值而产生不同输出。"
      ],
      [
        "recover 的有效位置",
        "panic 沿当前 goroutine 的调用栈展开并执行 defer。recover 必须由延迟执行的函数直接调用才能恢复正在发生的 panic；另一个 goroutine 无法替你恢复。普通业务失败优先返回 error。"
      ]
    ],
    "pitfall": "recover 恢复后，发生 panic 的函数会返回，并不会回到 panic 的下一行继续执行。调用该函数的外层代码可以继续。",
    "code": "package main\n\nimport \"fmt\"\n\nfunc demonstrate(n int) {\n    defer fmt.Println(\"最后执行\")\n    defer fmt.Println(\"捕获参数:\", n)\n    defer func() {\n        if value := recover(); value != nil {\n            fmt.Println(\"恢复:\", value)\n        }\n    }()\n    n++\n    panic(\"演示异常\")\n}\n\nfunc main() {\n    demonstrate({{n}})\n    fmt.Println(\"继续运行\")\n}\n",
    "hint": "先预测三个 defer 的顺序，以及 n++ 是否改变「捕获参数」的输出。",
    "steps": [
      "注册三个 defer，输出 n 的调用此时就保存参数。",
      "panic 触发最晚注册的恢复函数，再依次执行剩余 defer。",
      "demonstrate 返回，main 打印「继续运行」。"
    ],
    "choice": {
      "question": "defer fmt.Println(n) 后执行 n++，延迟输出的是哪个值？",
      "options": [
        "注册时的 n",
        "增加后的 n",
        "随机值"
      ],
      "answer": 0,
      "explanation": "延迟调用的参数在注册 defer 时求值，而不是执行时才求值。"
    },
    "fill": {
      "question": "在延迟执行的函数内恢复 panic。",
      "snippet": "defer func() {\n    if value := ____(); value != nil {\n        fmt.Println(value)\n    }\n}()",
      "answers": [
        "recover"
      ],
      "explanation": "recover 必须直接在延迟执行的函数内调用，才能恢复当前 goroutine 的 panic。"
    },
    "challenge": "将 defer fmt.Println(\"捕获参数:\", n) 改为匿名函数形式，观察输出变化。然后删除 recover，确认外层 main 是否继续执行。",
    "resources": [
      [
        "Go 官方：Defer, Panic, and Recover",
        "https://go.dev/blog/defer-panic-and-recover"
      ]
    ]
  },
  {
    "id": "slice-memory",
    "title": "切片底层数组、容量与复制",
    "group": "语言深入",
    "level": "进阶",
    "description": "区分切片描述符与底层数组，理解 append 何时影响原切片。",
    "concepts": [
      [
        "len 与 cap 管理不同边界",
        "切片包含底层数组引用、长度和容量。len 决定可直接索引的范围；cap 表示从切片起点到数组末尾的可用空间。切片赋值只复制描述符，不复制元素。"
      ],
      [
        "完整切片表达式限制容量",
        "base[:2:2] 的长度和容量都为 2。此时再 append 一个元素必须分配新的底层数组；base[:2] 通常仍有额外容量，追加可能改写 base[2]。"
      ],
      [
        "copy：复制元素而不是引用",
        "先 make 一个独立目标切片，再 copy(dst, src)。copy 返回实际复制数量，数量是两者长度的较小值；不会自动扩大 dst。若元素含指针或切片，这仍是浅复制。"
      ]
    ],
    "pitfall": "限制容量不等于立刻复制。base[:2:2] 在 append 之前仍与 base 共享元素；只有这里超出容量的 append 才产生新数组。",
    "code": "package main\n\nimport \"fmt\"\n\nfunc main() {\n    base := []int{1, 2, 3}\n    shared := base[:2]\n    shared[0] = {{n}}\n    fmt.Println(\"共享:\", base)\n    isolated := append(base[:2:2], 99)\n    isolated[0] = 8\n    fmt.Println(\"原切片:\", base)\n    fmt.Println(\"新切片:\", isolated)\n    copied := make([]int, len(base))\n    copy(copied, base)\n    copied[0] = 0\n    fmt.Println(\"复制:\", copied)\n}\n",
    "hint": "观察两次赋值：shared[0] 会改变 base，isolated[0] 不会。",
    "steps": [
      "shared 与 base 共用数组，因此首元素改为 n。",
      "完整切片表达式把容量限制为 2；append 使新切片独立。",
      "make 与 copy 再得到一份独立的元素副本。"
    ],
    "choice": {
      "question": "base 长度为 3，base[:2:2] 的 cap 是多少？",
      "options": [
        "3",
        "2",
        "1"
      ],
      "answer": 1,
      "explanation": "三索引表达式 s[low:high:max] 的容量为 max-low，这里是 2。"
    },
    "fill": {
      "question": "将 src 元素复制到已分配的 dst。",
      "snippet": "dst := make([]int, len(src))\n____(dst, src)",
      "answers": [
        "copy"
      ],
      "explanation": "copy 将元素写入目标切片，复制数量受目标长度限制。"
    },
    "challenge": "把 base[:2:2] 改为 base[:2]，观察 base[2] 和 base[0] 的变化。再尝试 make([]int, 0, len(base))，预测 copy 能复制几个元素。",
    "resources": [
      [
        "Go 官方：Slices: usage and internals",
        "https://go.dev/blog/slices-intro"
      ]
    ]
  },
  {
    "id": "error-chain",
    "title": "错误包装、errors.Is 与 errors.As",
    "group": "标准库实践",
    "level": "进阶",
    "description": "保留底层错误信息，在多层调用中识别错误种类与附加数据。",
    "concepts": [
      [
        "error 是接口，可携带数据",
        "只需实现 Error() string 即可满足 error。自定义错误可包含输入值等字段，调用者不必通过解析提示文本来获得这些数据。"
      ],
      [
        "%w 保留可解包的错误链",
        "fmt.Errorf(\"保存失败: %w\", err) 添加上下文并包装原始错误。%v 只格式化文本，不建立这层可供 errors.Is / As 遍历的关系。"
      ],
      [
        "Is 判断错误，As 提取类型",
        "errors.Is(err, target) 检查错误链是否匹配目标错误；errors.As(err, &input) 寻找匹配类型并写入变量。input 是 *InputError，所以这里传入它的地址 **InputError。"
      ]
    ],
    "pitfall": "不要通过 err.Error() == \"某段文字\" 判断错误种类，包装后文本可能改变。errors.As 的目标必须是适当类型的非 nil 指针，否则会 panic。",
    "code": "package main\n\nimport (\n    \"errors\"\n    \"fmt\"\n)\n\ntype InputError struct { Value int }\nfunc (e *InputError) Error() string {\n    return fmt.Sprintf(\"参数 %d 不合法\", e.Value)\n}\n\nfunc main() {\n    err := fmt.Errorf(\"保存失败: %w\", &InputError{Value: {{n}}})\n    var input *InputError\n    if errors.As(err, &input) {\n        fmt.Println(\"错误参数:\", input.Value)\n    }\n    fmt.Println(err)\n}\n",
    "hint": "错误被增加了一层上下文，errors.As 仍能拿到底层的 Value。",
    "steps": [
      "创建带 Value 字段的指针错误。",
      "%w 将它包在「保存失败」中。",
      "As 沿错误链查找 *InputError，成功后读取字段。"
    ],
    "choice": {
      "question": "想添加错误上下文，同时保留底层错误链，应使用哪个格式？",
      "options": [
        "%s",
        "%v",
        "%w"
      ],
      "answer": 2,
      "explanation": "fmt.Errorf 的 %w 建立包装关系；%v 只保留格式化后的文本。"
    },
    "fill": {
      "question": "从包装后的 err 提取 *InputError。",
      "snippet": "var input *InputError\nif errors.____(err, &input) {\n    fmt.Println(input.Value)\n}",
      "answers": [
        "As"
      ],
      "explanation": "As 查找类型；Is 用于匹配特定目标错误。"
    },
    "challenge": "把 %w 改为 %v，观察是否还能输出错误参数。再用 errors.New 定义哨兵错误，包装两层并通过 errors.Is 检查。",
    "resources": [
      [
        "errors 标准库",
        "https://pkg.go.dev/errors"
      ]
    ]
  },
  {
    "id": "json",
    "title": "JSON、结构体标签与编码边界",
    "group": "标准库实践",
    "level": "进阶",
    "description": "在 Go 类型与 JSON 数据之间转换，理解标签、导出字段和错误检查。",
    "concepts": [
      [
        "Marshal：Go 值转为字节",
        "json.Marshal 返回 []byte 与 error。JSON 编码器处理结构体的导出字段；小写开头的字段不会被编码。将字节转为 string 才能直接查看 JSON 文本。"
      ],
      [
        "结构体标签约定字段名",
        "反引号中的 json:\"name\" 指定 JSON 键名，omitempty 可省略空值字段，json:\"-\" 排除字段。标签不是普通 Go 字段，也不会自动验证业务数据。"
      ],
      [
        "Unmarshal：传入可写目标",
        "json.Unmarshal(data, &decoded) 通过指针写入值。语法错误或类型不匹配会返回 error。默认忽略未知字段；严格接口可使用 Decoder.DisallowUnknownFields，并额外校验业务规则。"
      ]
    ],
    "pitfall": "解码成功不等于业务数据合法。缺失的 int 字段通常仍为 0，默认解码也不会替你拒绝未知字段。",
    "code": "package main\n\nimport (\n    \"encoding/json\"\n    \"fmt\"\n)\n\ntype Profile struct {\n    Name string `json:\"name\"`\n    Level int `json:\"level\"`\n}\n\nfunc main() {\n    data, err := json.Marshal(Profile{Name: \"Gopher\", Level: {{n}}})\n    if err != nil {\n        fmt.Println(err)\n        return\n    }\n    fmt.Println(string(data))\n    var decoded Profile\n    if err := json.Unmarshal(data, &decoded); err != nil {\n        fmt.Println(err)\n        return\n    }\n    fmt.Println(decoded.Name, decoded.Level)\n}\n",
    "hint": "JSON 使用标签定义的 name、level，Go 中仍使用 Name、Level。",
    "steps": [
      "编码 Profile，并检查编码错误。",
      "输出 JSON，再将同一份字节解码到新结构体。",
      "通过导出字段访问还原后的数据。"
    ],
    "choice": {
      "question": "json.Unmarshal 写入结构体变量 decoded 时，应该传入什么？",
      "options": [
        "decoded",
        "&decoded",
        "decoded.Name"
      ],
      "answer": 1,
      "explanation": "解码器需要目标地址来修改 decoded，传入非指针结构体会返回错误。"
    },
    "fill": {
      "question": "将 Name 的 JSON 键名指定为 name。",
      "snippet": "type Profile struct {\n    Name string `____:\"name\"`\n}",
      "answers": [
        "json"
      ],
      "explanation": "encoding/json 读取 json 标签，决定字段的键名和编码选项。"
    },
    "challenge": "添加带 omitempty 的 Note 字段，分别设置空字符串与非空字符串。再把输入中的 level 改成字符串，检查错误处理。",
    "resources": [
      [
        "encoding/json 标准库",
        "https://pkg.go.dev/encoding/json"
      ]
    ]
  },
  {
    "id": "generics",
    "title": "泛型、类型集合与约束",
    "group": "语言深入 · 泛型",
    "level": "进阶",
    "description": "用一个求和函数处理多种数值类型，并支持自定义底层类型。",
    "concepts": [
      [
        "类型参数写在方括号中",
        "func Sum[T Number](values []T) T 声明类型参数 T，Number 为它的约束。调用时可以显式写 Sum[int]，通常也可由 []int 实参推断 T。"
      ],
      [
        "约束决定能使用的操作",
        "~int | ~float64 是两个类型集合的并集。~int 包含底层类型为 int 的自定义类型；没有 ~ 的 int 只表示 int 本身。只有所有允许类型都支持的操作才能在泛型函数中使用。"
      ],
      [
        "零值与 comparable",
        "var total T 得到具体类型的零值。any 不保证可以相加，comparable 允许 == 和 !=，常用于 map 键；数值求和应使用支持 + 的数值约束。类型集合接口只用于约束，不能作为普通变量类型。"
      ]
    ],
    "pitfall": "泛型不会让 Go 变成动态类型语言。传入不满足约束的类型会编译失败，也不能将 []int 直接当作 []float64。",
    "code": "package main\n\nimport \"fmt\"\n\ntype Number interface { ~int | ~float64 }\ntype Points int\nfunc Sum[T Number](values []T) T {\n    var total T\n    for _, value := range values {\n        total += value\n    }\n    return total\n}\n\nfunc main() {\n    fmt.Println(\"整数:\", Sum([]int{ {{n}}, 2, 3 }))\n    fmt.Println(\"小数:\", Sum([]float64{1.5, 2.5}))\n    fmt.Println(\"自定义类型:\", Sum([]Points{Points({{n}}), 2}))\n}\n",
    "hint": "三个调用共用 Sum，返回值分别保持 int、float64 和 Points 类型。",
    "steps": [
      "约束同时允许整数、浮点数及对应的自定义底层类型。",
      "编译器根据切片实参推断 T。",
      "在不同具体类型的零值上累加，不需要类型断言。"
    ],
    "choice": {
      "question": "为了让 type Points int 满足数值约束，应该使用哪个类型项？",
      "options": [
        "int",
        "~int",
        "any + int"
      ],
      "answer": 1,
      "explanation": "~int 表示底层类型为 int 的类型集合，包含 Points。"
    },
    "fill": {
      "question": "约束一个用作 map 键的类型参数。",
      "snippet": "func Contains[K ____](m map[K]bool, key K) bool {\n    return m[key]\n}",
      "answers": [
        "comparable"
      ],
      "explanation": "map 键必须可比较，comparable 为泛型类型参数提供该约束。"
    },
    "challenge": "去掉约束中的 ~，观察 Points 调用的编译错误。再加入 ~int64，并尝试 Sum([]int64{1, 2, 3})。",
    "resources": [
      [
        "Go 官方泛型教程",
        "https://go.dev/doc/tutorial/generics"
      ]
    ]
  },
  {
    "id": "select",
    "title": "select、缓冲 channel 与关闭语义",
    "group": "并发深入",
    "level": "进阶",
    "description": "协调 channel 操作，区分暂无数据、缓冲数据和已经关闭。",
    "concepts": [
      [
        "缓冲 channel 容纳有限数据",
        "make(chan int, 1) 能缓冲一个值，不需要接收者立即就绪。缓冲区满时发送仍会阻塞，空且未关闭时接收会阻塞；容量不是无限队列。"
      ],
      [
        "select 只执行一个可进行的分支",
        "select 同时考虑多个通信分支；若多个分支都可进行，会选择其中一个。存在 default 且没有通信就绪时立即执行 default；没有 default 则等待。它不是按 case 顺序排列优先级。"
      ],
      [
        "关闭后先读缓冲，再读零值",
        "value, ok := <-ch 中，ok=false 表示 channel 已关闭且缓冲数据读完。关闭通常由发送方负责；向关闭的 channel 发送或重复关闭会 panic。关闭的 channel 一直接收就绪。"
      ]
    ],
    "pitfall": "在无限循环中使用 select 的 default 可能造成忙等。监听已关闭的 channel 而不退出，也可能反复收到零值；可退出或将该分支的 channel 设为 nil。",
    "code": "package main\n\nimport \"fmt\"\n\nfunc main() {\n    jobs := make(chan int, 1)\n    jobs <- {{n}}\n    select {\n    case value := <-jobs:\n        fmt.Println(\"收到:\", value)\n    default:\n        fmt.Println(\"暂无任务\")\n    }\n    select {\n    case value := <-jobs:\n        fmt.Println(\"收到:\", value)\n    default:\n        fmt.Println(\"暂无任务\")\n    }\n    close(jobs)\n    value, ok := <-jobs\n    fmt.Println(\"关闭后:\", value, ok)\n}\n",
    "hint": "第一次 select 取出缓冲值，第二次走 default，关闭后接收返回零值与 false。",
    "steps": [
      "容量为 1，单次发送不阻塞。",
      "第一次接收清空缓冲，第二次 select 发现没有就绪通信。",
      "关闭并读空的 channel 返回 int 零值和 false。"
    ],
    "choice": {
      "question": "关闭且读空的 chan int 再接收，value, ok 是什么？",
      "options": [
        "0, false",
        "0, true",
        "必然阻塞"
      ],
      "answer": 0,
      "explanation": "接收关闭的 channel 不阻塞；缓冲读完后返回零值与 false。"
    },
    "fill": {
      "question": "没有就绪通信时立即走后备分支。",
      "snippet": "select {\ncase value := <-jobs:\n    fmt.Println(value)\n____:\n    fmt.Println(\"暂无任务\")\n}",
      "answers": [
        "default"
      ],
      "explanation": "default 使 select 在无通信就绪时立即返回。"
    },
    "challenge": "先 close(jobs)，再进行第一次接收，观察缓冲值是否仍能读到。最后尝试向关闭的 channel 发送，理解为什么由发送方管理关闭。",
    "resources": [
      [
        "Go Tour：select",
        "https://go.dev/tour/concurrency/5"
      ]
    ]
  },
  {
    "id": "context",
    "title": "context、取消传播与退出协作",
    "group": "并发深入",
    "level": "进阶",
    "description": "让调用方取消任务，让 goroutine 主动响应退出并释放资源。",
    "concepts": [
      [
        "Context 沿调用链传递",
        "通常将 ctx context.Context 放在函数的第一个参数。Background 用于根上下文；WithCancel 返回派生上下文与 cancel 函数。派生上下文会响应父级取消。不要把可选业务参数塞进 Context。"
      ],
      [
        "Done 是取消信号，不是强制终止",
        "cancel() 关闭 ctx.Done()，工作函数必须主动监听并退出。这里的 goroutine 等待 Done，再关闭 results。调用者读完 results 才继续，确保工作协程已结束。"
      ],
      [
        "取消、超时与资源清理",
        "ctx.Err() 区分 Canceled 和 DeadlineExceeded。WithTimeout 可设置最长等待时间；获得 cancel 后通常立即 defer cancel，即使提前成功也释放相关资源。发送结果时可用 select 同时监听 Done，避免无法退出。"
      ]
    ],
    "pitfall": "cancel 不会自动杀死 goroutine，也不会撤销已经发生的副作用。若工作函数从不检查 Done，任务仍可能一直运行。",
    "code": "package main\n\nimport (\n    \"context\"\n    \"fmt\"\n)\n\nfunc main() {\n    ctx, cancel := context.WithCancel(context.Background())\n    defer cancel()\n    results := make(chan int)\n    go func() {\n        defer close(results)\n        <-ctx.Done()\n    }()\n    fmt.Println(\"计划任务:\", {{n}})\n    cancel()\n    for value := range results {\n        fmt.Println(value)\n    }\n    fmt.Println(\"取消原因:\", ctx.Err())\n}\n",
    "hint": "示例主动取消，避免依赖真实等待时间；results 关闭表示工作 goroutine 已退出。",
    "steps": [
      "创建可以取消的上下文，安排返回时清理。",
      "goroutine 等待取消信号；主函数主动调用 cancel。",
      "等到结果 channel 关闭，读取 ctx.Err()。"
    ],
    "choice": {
      "question": "调用 cancel() 后，goroutine 一定会立即停止吗？",
      "options": [
        "一定，会被运行时强制终止",
        "不一定，任务需要主动监听取消",
        "只有 main 能被停止"
      ],
      "answer": 1,
      "explanation": "context 提供协作式取消信号，执行代码需要主动响应。"
    },
    "fill": {
      "question": "等待 context 的取消或超时信号。",
      "snippet": "select {\ncase <-ctx.____():\n    return\ncase value := <-jobs:\n    fmt.Println(value)\n}",
      "answers": [
        "Done"
      ],
      "explanation": "Done 返回取消时会关闭的 channel，适合与其他通信放入同一个 select。"
    },
    "challenge": "把 WithCancel 改为 WithTimeout，增加 time 导入和 100*time.Millisecond 超时，删除主动 cancel 调用。观察原因变为 context deadline exceeded。",
    "resources": [
      [
        "context 标准库",
        "https://pkg.go.dev/context"
      ]
    ]
  },
  {
    "id": "mutex",
    "title": "Mutex、共享状态与数据竞争",
    "group": "并发深入",
    "level": "进阶",
    "description": "让多个 goroutine 安全修改同一份数据，区分互斥与等待。",
    "concepts": [
      [
        "count++ 不是并发安全的",
        "读出、增加、写回是一个需要保护的操作组合。多个 goroutine 并发访问同一变量且至少一个写入，需要同步；结果偶尔正确也不代表没有数据竞争。"
      ],
      [
        "Mutex 保护临界区",
        "Lock 到 Unlock 之间的共享状态访问构成临界区。所有访问同一状态的 goroutine 必须遵守同一把锁；使用 defer Unlock 可避免提前返回漏解锁，临界区应尽量短。"
      ],
      [
        "WaitGroup 与锁职责不同",
        "WaitGroup 用来等所有任务完成，不能代替互斥锁。这里在启动前 Add，任务退出时 Done，主程序 Wait 后才读取最终计数，因此读取发生在全部写入结束之后。Mutex 首次使用后不应复制。"
      ]
    ],
    "pitfall": "不要持锁等待一个也需要此锁才能完成的任务。Lock 不可重入，同一 goroutine 连续 Lock 同一把锁也会阻塞。",
    "code": "package main\n\nimport (\n    \"fmt\"\n    \"sync\"\n)\n\nfunc main() {\n    var mu sync.Mutex\n    var wg sync.WaitGroup\n    count := 0\n    for i := 0; i < {{n}}; i++ {\n        wg.Add(1)\n        go func() {\n            defer wg.Done()\n            mu.Lock()\n            defer mu.Unlock()\n            count++\n        }()\n    }\n    wg.Wait()\n    fmt.Println(\"安全计数:\", count)\n}\n",
    "hint": "虽然执行顺序不确定，锁与 Wait 保证最终结果始终等于 n。",
    "steps": [
      "每个任务加入 WaitGroup 后启动。",
      "临界区内增加计数，返回时先解锁再标记任务完成。",
      "Wait 确保全部任务结束，然后读取最终计数。"
    ],
    "choice": {
      "question": "哪个工具直接防止多个 goroutine 同时修改 count？",
      "options": [
        "WaitGroup",
        "Mutex",
        "fmt.Println"
      ],
      "answer": 1,
      "explanation": "Mutex 提供互斥访问；WaitGroup 只等待任务完成。"
    },
    "fill": {
      "question": "离开临界区时释放 mu。",
      "snippet": "mu.Lock()\ndefer mu.____()\ncount++",
      "answers": [
        "Unlock"
      ],
      "explanation": "Lock 与 Unlock 必须配对；defer 确保当前函数返回时解锁。"
    },
    "challenge": "在本机把任务数量改成 1000，删除锁并执行 go run -race main.go，观察数据竞争报告；恢复锁再运行。浏览器编译器适合观察输出，race 检测请在支持的平台本机执行。",
    "resources": [
      [
        "sync 标准库",
        "https://pkg.go.dev/sync"
      ],
      [
        "Go 数据竞争检测器",
        "https://go.dev/doc/articles/race_detector"
      ]
    ]
  },
  {
    "id": "testing",
    "title": "表驱动测试、子测试与边界设计",
    "group": "工程实践",
    "level": "进阶",
    "description": "用一张用例表表达正常值、零值和边界，再迁移到真正的 go test。",
    "concepts": [
      [
        "表驱动测试：数据与验证分开",
        "将名称、输入、预期结果放在结构体切片中，用同一验证逻辑遍历。预期结果应来自需求或独立计算，不能直接调用被测试函数生成，否则测试会失去发现错误的能力。"
      ],
      [
        "真正的测试使用 testing.T",
        "测试写在 *_test.go，函数签名为 func TestAdd(t *testing.T)。t.Run(name, func(t *testing.T) { ... }) 建立子测试；不匹配时用 t.Fatalf 给出 got 与 want。go test 会以失败状态退出。"
      ],
      [
        "边界、race 与运行方式",
        "除了普通输入，还要覆盖零值、负数和错误路径。go test ./... 测试全部包，-run 过滤名称，-race 检查运行中被触发的数据竞争。下面 main 演示用例表，不替代测试框架；仓库 examples/testing 含真正的子测试。"
      ]
    ],
    "pitfall": "Println(false) 不会让 go test 失败。测试函数需要调用 testing.T 的失败方法；未触发的路径也不会被 race 检测器自动发现。",
    "code": "package main\n\nimport \"fmt\"\n\nfunc Add(a, b int) int { return a + b }\n\nfunc main() {\n    cases := []struct {\n        name string\n        a, b, want int\n    }{\n        {\"普通值\", {{n}}, 2, {{n}} + 2},\n        {\"零值\", 0, 0, 0},\n        {\"负数\", -1, 1, 0},\n    }\n    for _, tc := range cases {\n        got := Add(tc.a, tc.b)\n        fmt.Println(tc.name, got == tc.want)\n    }\n}\n",
    "hint": "当前示例可以在网站与 OneCompiler 运行。真正的 *_test.go 子测试请使用下方仓库示例与 go test。",
    "steps": [
      "为普通值、零值和负数分别写预期结果。",
      "同一循环调用 Add 并比较结果。",
      "迁移到 *_test.go 后用 t.Run 和 t.Fatalf 替换打印。"
    ],
    "choice": {
      "question": "在真正的 Go 测试里发现结果错误，哪个操作能报告失败并停止当前子测试？",
      "options": [
        "fmt.Println(false)",
        "t.Fatalf(\"got=%d want=%d\", got, want)",
        "return nil"
      ],
      "answer": 1,
      "explanation": "t.Fatalf 标记当前测试失败并停止当前测试 goroutine；普通打印不会报告测试失败。"
    },
    "fill": {
      "question": "使用具名子测试组织每一行用例。",
      "snippet": "for _, tc := range cases {\n    t.____(tc.name, func(t *testing.T) {\n        if got := Add(tc.a, tc.b); got != tc.want {\n            t.Fatalf(\"got=%d want=%d\", got, tc.want)\n        }\n    })\n}",
      "answers": [
        "Run"
      ],
      "explanation": "t.Run 创建一个有名称的子测试，可独立查看与筛选。"
    },
    "challenge": "把 Add 的实现故意改为 a-b，找出哪些用例能够揭示错误。然后在仓库的 add_test.go 增加一条不同负数相加的子测试，运行 go test ./examples/testing -v。",
    "resources": [
      [
        "testing 标准库",
        "https://pkg.go.dev/testing"
      ],
      [
        "仓库中的真正表驱动测试",
        "https://github.com/MU-ty/go-task-lab/tree/main/examples/testing"
      ]
    ]
  }
]);
