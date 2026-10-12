// Run from the repository root: node scripts/check-courses.cjs (Go must be on PATH).
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

function expected(id, n) {
  const outputs = {
    hello: 'Hello, Go!\n', variables: `Go ${n} ${10-n}\n`,
    conditions: `${n>=6?'通过':'继续练习'} ${n*10}\n`, loops: `总和: ${n*(n+1)/2}\n`,
    functions: `${n+2}\n`, slices: `0 1\n1 2\n2 ${n}\n`, maps: `${n} true\n1\n`,
    structs: `小 Go ${n+1}\n`, interfaces: '你好，小 Go\n',
    concurrency: `平方和: ${n*(n+1)*(2*n+1)/6}\n`,
    closures: `${n+3}\n${n+10}\n`,
    defer: `恢复: 演示异常\n捕获参数: ${n}\n最后执行\n继续运行\n`,
    'slice-memory': `共享: [${n} 2 3]\n原切片: [${n} 2 3]\n新切片: [8 2 99]\n复制: [0 2 3]\n`,
    'error-chain': `错误参数: ${n}\n保存失败: 参数 ${n} 不合法\n`,
    json: `{"name":"Gopher","level":${n}}\nGopher ${n}\n`,
    generics: `整数: ${n+5}\n小数: 4\n自定义类型: ${n+2}\n`,
    select: `收到: ${n}\n暂无任务\n关闭后: 0 false\n`,
    context: `计划任务: ${n}\n取消原因: context canceled\n`,
    mutex: `安全计数: ${n}\n`,
    testing: '普通值 true\n零值 true\n负数 true\n'
  };
  if (!(id in outputs)) throw new Error(`Missing expected output: ${id}`);
  return outputs[id];
}

module.exports = { expected };
if (require.main === module) {
  const courses = vm.runInNewContext(fs.readFileSync('internal/web/static/courses.js', 'utf8')+'\nCOURSES');
  if (courses.length !== 20 || new Set(courses.map(c=>c.id)).size !== 20) throw new Error('Expected 20 unique chapters');
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'go-courses-'));
  const file = path.join(scratch, 'main.go');
  let checks = 0;
  try {
    for (const course of courses) {
      if (course.choice.answer < 0 || course.choice.answer >= course.choice.options.length || !course.fill.answers.length) throw new Error(`${course.id}: invalid exercise`);
      for (const n of course.parameter === false ? [3] : [1,3,6,9]) {
        fs.writeFileSync(file, course.code.replaceAll('{{n}}', String(n)));
        const actual = execFileSync('go', ['run', file], {encoding:'utf8',timeout:30000}).replaceAll('\r\n','\n');
        if (actual !== expected(course.id,n)) throw new Error(`${course.id} n=${n}: got ${JSON.stringify(actual)}`);
        checks++;
      }
      console.log(`✓ ${course.id}`);
    }
    console.log(`Verified ${courses.length} chapters, ${courses.length*2} exercises and ${checks} actual Go snippet runs.`);
  } finally {
    if (fs.existsSync(file)) fs.unlinkSync(file);
    fs.rmdirSync(scratch);
  }
}
