// 前端只负责交互；真实数据由 Go API 读取和保存。
const $ = (selector) => document.querySelector(selector);
const state = { tasks: [], filter: 'all', search: '', busy: false, connected: false };
let toastTimer;
let deleteTarget = null;

$('#today').textContent = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date());

function notify(message, error = false) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.toggle('error', error);
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, error ? 6000 : 2600);
}

async function api(path, method = 'GET', data) {
  const options = { method, headers: {} };
  if (data !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(data);
  }
  const controller = new AbortController();
  options.signal = controller.signal;
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(path, options);
    if (response.status === 204) return null;
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || '操作失败，请重试');
    return body;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('请求超时，请检查 Go 服务并刷新');
    if (error instanceof TypeError) throw new Error('无法连接 Go 服务，请检查服务是否运行');
    throw error;
  } finally { clearTimeout(timer); }
}

function connection(online) {
  state.connected = online;
  $('#connection-dot').className = `connection-dot ${online ? 'online' : 'offline'}`;
  $('#connection-text').textContent = online ? 'Go 服务已连接' : 'Go 服务连接失败';
}

function setBusy(busy) {
  state.busy = busy;
  $('#add-button').disabled = busy;
  $('#refresh').disabled = busy;
  $('#add-button').textContent = busy ? '处理中…' : '添加任务 ↗';
  document.querySelectorAll('.task-checkbox, .delete-button').forEach((element) => { element.disabled = busy; });
}

function emptyState(title, message) {
  const box = document.createElement('div');
  box.className = 'empty';
  const icon = document.createElement('span');
  icon.className = 'empty-icon';
  icon.textContent = '✓';
  const heading = document.createElement('strong');
  heading.textContent = title;
  const description = document.createElement('p');
  description.textContent = message;
  box.append(icon, heading, description);
  return box;
}

function render() {
  const completed = state.tasks.filter((task) => task.done).length;
  $('#total').textContent = state.tasks.length;
  $('#open').textContent = state.tasks.length - completed;
  $('#done').textContent = completed;
  $('#filter-count').textContent = state.tasks.length;
  $('#completion-label').textContent = state.tasks.length ? `完成进度 ${Math.round(completed / state.tasks.length * 100)}% · 继续加油` : '今天也是新的开始';
  const tasks = state.tasks.filter((task) => {
    const matchesStatus = state.filter === 'all' || (state.filter === 'done' ? task.done : !task.done);
    return matchesStatus && task.title.toLocaleLowerCase().includes(state.search.toLocaleLowerCase());
  });
  const list = $('#task-list');
  list.replaceChildren();
  list.setAttribute('aria-busy', 'false');
  $('#list-summary').textContent = `显示 ${tasks.length} 项 · 共 ${state.tasks.length} 项任务`;
  if (!tasks.length) {
    const isSearch = Boolean(state.search);
    list.append(emptyState(isSearch ? '没有找到匹配任务' : state.filter === 'done' ? '完成第一项，就从现在开始' : state.filter === 'open' && state.tasks.length ? '都完成了，做得不错' : '给今天写下第一个计划', isSearch ? '试试其他关键词，或清空搜索。' : '从上方添加一件小事，让进步看得见。'));
  }
  for (const task of tasks) {
    const row = document.createElement('div');
    row.className = `task-row${task.done ? ' completed' : ''}`;
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.done;
    checkbox.disabled = state.busy;
    checkbox.setAttribute('aria-label', `${task.done ? '恢复未完成' : '完成'}：${task.title}`);
    checkbox.addEventListener('change', () => {
      checkbox.checked = task.done;
      mutate(() => api(`/api/tasks/${task.id}`, 'PATCH', { done: !task.done }), task.done ? '任务已恢复为未完成' : '又完成一件事，继续加油！');
    });
    const copy = document.createElement('div');
    copy.className = 'task-copy';
    const title = document.createElement('div');
    title.className = 'task-name';
    // 使用 textContent 避免把用户输入当作 HTML。
    title.textContent = task.title;
    const meta = document.createElement('div');
    meta.className = 'task-meta';
    meta.textContent = `TASK / ${String(task.id).padStart(3, '0')}`;
    copy.append(title, meta);
    const status = document.createElement('span');
    status.className = 'status-pill';
    status.textContent = task.done ? '已完成' : '进行中';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'delete-button';
    remove.textContent = '×';
    remove.title = '删除任务';
    remove.disabled = state.busy;
    remove.setAttribute('aria-label', `删除：${task.title}`);
    remove.addEventListener('click', () => {
      if (state.busy) return;
      deleteTarget = task;
      $('#delete-title').textContent = task.title;
      $('#delete-dialog').returnValue = '';
      $('#delete-dialog').showModal();
    });
    row.append(checkbox, copy, status, remove);
    list.append(row);
  }
}

async function load() {
  const tasks = await api('/api/tasks');
  state.tasks = tasks;
  connection(true);
  render();
}

async function mutate(action, message, afterSuccess) {
  if (state.busy) return;
  setBusy(true);
  try {
    await action();
    if (afterSuccess) afterSuccess();
    // 写入成功后重新读取，确保页面显示服务器实际数据。
    try {
      await load();
      notify(message);
    } catch (error) {
      connection(false);
      notify(`操作已保存，但列表刷新失败。请点击刷新：${error.message}`, true);
    }
  } catch (error) { notify(error.message, true); }
  finally { setBusy(false); }
}

$('#add-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = $('#task-title');
  const title = input.value.trim();
  if (!title) { notify('先写一个任务标题吧', true); input.focus(); return; }
  if ([...title].length > 120) { notify('标题不能超过 120 个字符', true); return; }
  const submittedValue = input.value;
  mutate(() => api('/api/tasks', 'POST', { title }), '新任务已添加', () => {
    if (input.value === submittedValue) input.value = '';
    input.focus();
  });
});

document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    state.filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach((item) => {
      const selected = item === button;
      item.classList.toggle('selected', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    if (state.connected) render();
  });
});
$('#search').addEventListener('input', (event) => { state.search = event.target.value.trim(); if (state.connected) render(); });
$('#delete-dialog').addEventListener('close', () => {
  const task = deleteTarget;
  deleteTarget = null;
  if ($('#delete-dialog').returnValue === 'confirm' && task) mutate(() => api(`/api/tasks/${task.id}`, 'DELETE'), '任务已删除');
});

async function refresh(initial = false) {
  if (state.busy) return;
  setBusy(true);
  try { await load(); if (!initial) notify('列表已更新'); }
  catch (error) {
    connection(false);
    $('#task-list').setAttribute('aria-busy', 'false');
    $('#task-list').replaceChildren(emptyState('暂时无法读取任务', '请确认 Go 服务正在运行，然后点击刷新重试。'));
    $('#list-summary').textContent = '连接失败 · 可以刷新重试';
    notify(error.message, true);
  } finally { setBusy(false); }
}
$('#refresh').addEventListener('click', () => refresh());
refresh(true);
