const $ = (s) => document.querySelector(s);
let current = 0, generation = 0, noticeTimer;
function notify(text) { $('#toast').textContent=text; $('#toast').hidden=false; clearTimeout(noticeTimer); noticeTimer=setTimeout(()=>{$('#toast').hidden=true;},2500); }
function nav(query='') {
  const root=$('#course-nav'); root.replaceChildren(); let group='',count=0;
  COURSES.forEach((c,i)=>{
    if (!`${c.title} ${c.group} ${c.concepts.flat().join(' ')}`.toLowerCase().includes(query.toLowerCase())) return;
    count++; if(group!==c.group){group=c.group;const h=document.createElement('div');h.className='nav-group';h.textContent=group;root.append(h);}
    const b=document.createElement('button');b.type='button';b.className=`nav-course${i===current?' active':''}`;b.setAttribute('aria-current',i===current?'page':'false');
    const n=document.createElement('span');n.className='nav-number';n.textContent=String(i+1).padStart(2,'0');const name=document.createElement('span');name.textContent=c.title;b.append(n,name);b.addEventListener('click',()=>select(i));root.append(b);
  });
  if(!count){const p=document.createElement('p');p.className='nav-empty';p.textContent='没有匹配的课程';root.append(p);}
}
function showTab(value,focus=false) {
  document.querySelectorAll('[data-tab]').forEach(b=>{const selected=b.dataset.tab===value;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;if(selected&&focus)b.focus();});
  ['learn','code','practice'].forEach(name=>{$(`#panel-${name}`).hidden=name!==value;});
}
function code(){const n=Number($('#parameter').value);$('#example-code').textContent=COURSES[current].code.replaceAll('{{n}}',Number.isInteger(n)&&n>=1&&n<=9?String(n):'3');}
function resetRun(message='点击下方按钮，查看 Go 的运行结果。'){generation++;$('#output').textContent=message;$('#run-status').textContent='等待运行';$('#run-code').disabled=false;$('#run-code').textContent='▷ 运行示例';}
function select(i){
  current=i;const c=COURSES[i];if(location.hash!==`#${c.id}`)history.replaceState(null,'',`#${c.id}`);
  $('#breadcrumb').textContent=c.group;$('#chapter-label').textContent=`CHAPTER ${String(i+1).padStart(2,'0')} / GO SYNTAX`;$('#lesson-title').textContent=c.title;$('#lesson-description').textContent=c.description;$('#level-tag').textContent=c.level;
  $('#concepts').replaceChildren();c.concepts.forEach(([title,text],j)=>{const section=document.createElement('section');section.className='concept';const n=document.createElement('span');n.className='concept-number';n.textContent=String(j+1).padStart(2,'0');const body=document.createElement('div');const h=document.createElement('h3');h.textContent=title;const p=document.createElement('p');p.textContent=text;body.append(h,p);section.append(n,body);$('#concepts').append(section);});
  $('#pitfall').textContent=c.pitfall;$('#example-hint').textContent=c.hint;$('#parameter').value='3';$('#parameter').disabled=c.parameter===false;code();resetRun();
  $('#walkthrough').replaceChildren();c.steps.forEach(text=>{const li=document.createElement('li');li.textContent=text;$('#walkthrough').append(li);});
  $('#choice-question').textContent=c.choice.question;$('#choice-options').replaceChildren();const legend=document.createElement('legend');legend.className='sr-only';legend.textContent='选择一个答案';$('#choice-options').append(legend);
  c.choice.options.forEach((text,j)=>{const label=document.createElement('label');label.className='option';const input=document.createElement('input');input.type='radio';input.name='answer';input.value=String(j);input.required=true;const letter=document.createElement('span');letter.className='option-letter';letter.textContent=String.fromCharCode(65+j);const content=document.createElement('span');content.textContent=text;label.append(input,letter,content);$('#choice-options').append(label);});
  $('#fill-question').textContent=c.fill.question;$('#fill-snippet').textContent=c.fill.snippet;$('#fill-answer').value='';$('#choice-feedback').hidden=true;$('#fill-feedback').hidden=true;
  $('#previous').disabled=i===0;$('#next').disabled=i===COURSES.length-1;$('#chapter-position').textContent=`第 ${i+1} / ${COURSES.length} 章`;nav($('#course-search').value);showTab('learn');
}
function feedback(element,correct,text){element.hidden=false;element.className=`feedback ${correct?'correct':'incorrect'}`;element.textContent=text;}
document.querySelectorAll('[data-tab]').forEach((button,i)=>{button.addEventListener('click',()=>showTab(button.dataset.tab));button.addEventListener('keydown',e=>{let target;if(e.key==='ArrowRight')target=(i+1)%3;if(e.key==='ArrowLeft')target=(i+2)%3;if(e.key==='Home')target=0;if(e.key==='End')target=2;if(target!==undefined){e.preventDefault();showTab(['learn','code','practice'][target],true);}});});
$('#try-example').addEventListener('click',()=>showTab('code',true));
$('#parameter').addEventListener('input',()=>{code();resetRun('参数已修改，请重新运行。');});
$('#reset-parameter').addEventListener('click',()=>{$('#parameter').value='3';code();resetRun('参数已重置，请重新运行。');});
$('#run-code').addEventListener('click',async()=>{
  if(!$('#parameter').reportValidity())return;const c=COURSES[current],n=Number($('#parameter').value),token=++generation,b=$('#run-code');b.disabled=true;b.textContent='正在运行…';$('#run-status').textContent='RUNNING';const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);
  try{let body;if(window.GoLearningReady){await window.GoLearningReady;body=window.GoLearningRun(c.id,n);if(body.error)throw new Error(body.error);}else{const r=await fetch(`/api/lessons/${c.id}/run?n=${n}`,{signal:controller.signal});body=await r.json();if(!r.ok)throw new Error(body.error||'运行失败');}if(token!==generation)return;$('#output').textContent=body.output;$('#run-status').textContent='SUCCESS';}
  catch(e){if(token!==generation)return;$('#output').textContent=e.name==='AbortError'?'请求超时，请重试。':`运行失败：${e.message}。请刷新页面后重试。`;$('#run-status').textContent='ERROR';}
  finally{clearTimeout(timer);if(token===generation){b.disabled=false;b.textContent='▷ 再次运行';}}
});
$('#copy-code').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#example-code').textContent);notify('代码已复制，可在本机 Go 环境运行');}catch{notify('无法访问剪贴板，请选中代码后复制');}});
$('#choice-form').addEventListener('submit',e=>{e.preventDefault();const selected=new FormData(e.currentTarget).get('answer');if(selected===null)return;const q=COURSES[current].choice,correct=Number(selected)===q.answer;feedback($('#choice-feedback'),correct,`${correct?'回答正确。':'再想一想。'} ${q.explanation}`);});
$('#fill-form').addEventListener('submit',e=>{e.preventDefault();const q=COURSES[current].fill,correct=q.answers.includes($('#fill-answer').value.trim());feedback($('#fill-feedback'),correct,correct?`补全正确。${q.explanation}`:'还不正确。回到本章讲解，检查需要的是关键字、函数名还是运算符。');});
$('#show-answer').addEventListener('click',()=>{const q=COURSES[current].fill;feedback($('#fill-feedback'),true,`参考答案：${q.answers[0]}。${q.explanation}`);});
$('#previous').addEventListener('click',()=>{if(current>0)select(current-1);});$('#next').addEventListener('click',()=>{if(current<COURSES.length-1)select(current+1);});$('#course-search').addEventListener('input',e=>nav(e.target.value.trim()));
window.addEventListener('hashchange',()=>{const i=COURSES.findIndex(c=>`#${c.id}`===location.hash);if(i>=0&&i!==current)select(i);});
const initial=COURSES.findIndex(c=>`#${c.id}`===location.hash);select(initial>=0?initial:0);
