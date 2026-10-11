// 此脚本仅由 Pages 构建注入；本地 HTTP 版本仍使用 API。
window.GoLearningReady = (async () => {
  if (typeof Go !== 'function' || typeof WebAssembly === 'undefined') throw new Error('浏览器不支持 Go WebAssembly');
  const go = new Go();
  const response = await fetch(new URL('./examples.wasm', document.baseURI));
  if (!response.ok) throw new Error('Go 示例文件下载失败，请刷新后重试');
  const bytes = await response.arrayBuffer();
  const result = await WebAssembly.instantiate(bytes, go.importObject);
  // go.run 初始化入口并保持运行，不等待这个长期存活的 Promise。
  const running = go.run(result.instance);
  running.catch((error) => { console.error('Go runtime stopped:', error); });
  if (typeof window.GoLearningRun !== 'function') throw new Error('Go 运行时未能初始化');
})();
// 初始化失败在点击运行时展示，避免未处理的 Promise 拒绝。
window.GoLearningReady.catch(() => {});
