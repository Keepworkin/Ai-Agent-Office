/* Live transport is optional: a static host retains the original demo. */
const officeStore = OfficeLiveState.createStore();
window.officeStore = officeStore;
let mutationPending = false;
const demoDetailContent = detailContent;
const demoRender = render;
const revisionDrafts = new Map();
const liveAgent = () => officeStore.agents.find(agent => agent.id === selected);
let reviewTaskId = null;
const selectedTask = () => officeStore.tasks.find(task => task.id === reviewTaskId) ||
  (liveAgent() && OfficeLiveState.taskFor(officeStore, liveAgent()));
// Identifies what the open dialog's markup was built for; see detailContent.
let detailKey = null;
const demoOpenAgent = openAgent;
openAgent = function (id) {
  // Pin the dialog to the agent's active task so it doesn't jump to another
  // task when the agent finishes an early stage.
  const agent = officeStore.live && officeStore.agents.find(agent => agent.id === id);
  const task = agent && OfficeLiveState.taskFor(officeStore, agent);
  reviewTaskId = task && ['queued', 'in_progress', 'review'].includes(task.status) ? task.id : null;
  detailKey = null;
  demoOpenAgent(id);
};
const demoReviewNext = $('#reviewnext').onclick;
$('#reviewnext').onclick = () => {
  if (!officeStore.live) return demoReviewNext();
  const task = officeStore.tasks.find(task => task.status === 'review');
  if (!task) return;
  const finalStage = Math.max(...task.steps.map(step => step.stage));
  const step = task.steps.find(step => step.stage === finalStage && initial.some(agent => agent.id === step.agentId));
  if (!step) return;
  selected = step.agentId; reviewTaskId = task.id; detailKey = null; detailContent(); $('#detail').showModal();
};
function connectionLabels() {
  if (!officeStore.live) return;
  const mock = officeStore.agents.some(agent => agent.mock);
  $('.demo').textContent = officeStore.connected ? (mock ? 'LIVE FEED · MOCK PROVIDERS' : 'LIVE FEED') : 'RECONNECTING';
  $('.sidebottom p').textContent = officeStore.connected
    ? 'Tasks come from your server. Agents tagged mock generate simulated output.'
    : 'Connection lost. Showing the last known state; task controls resume after reconnecting.';
  $('.legendright').textContent = officeStore.connected ? 'Server activity' : 'Connection lost';
  $('.rosterhead > span').textContent = 'ChatGPT + Claude · Server teammates';
  $('#taskform .muted').textContent = 'Give an available teammate something to focus on.';
  // Target the disclosure by id: #workflowinfo is also a p.small in this form.
  $('#taskdisclosure').textContent = 'Uses each agent’s server provider. Mock tags mean simulated output; configured providers make real API calls.';
  $('#reset').hidden = true;
  $('#pause').textContent = paused ? '▶ Resume animation' : 'Ⅱ Pause animation';
  $('#newtask').disabled = !officeStore.connected || mutationPending;
  $('#taskform button[type="submit"]').disabled = !officeStore.connected || mutationPending;
  const reviews = officeStore.tasks.filter(task => task.status === 'review').length;
  $('#reviewcount').textContent = reviews ? `${reviews} task${reviews === 1 ? '' : 's'} to review` : 'You’re all caught up';
  $('#reviewnext').disabled = !reviews;
  $('#stats').querySelectorAll('.stat strong')[2].textContent = String(reviews).padStart(2, '0');
  const stats = $('#stats').querySelectorAll('.stat small');
  stats[0].textContent = 'Connected robot team';
  stats[3].textContent = 'Approved on this server';
}
render = function () { demoRender(); connectionLabels(); };
function stepLabel(step) {
  const agent = officeStore.agents.find(a => a.id === step.agentId);
  return `${agent?.name || step.agentId} · ${OfficeLiveState.providerName(agent?.provider)}${agent?.mock ? ' · MOCK' : ''} · ${step.status}`;
}
const stepText = step => step.error || step.output || 'Waiting for output…';
/** Output grouped by stage; agents in the same stage sit side by side. */
function outputMarkup(task) {
  const stages = OfficeLiveState.stagesOf(task);
  return stages.map((group, i) => `<div class="outputstage" style="--cols:${group.length}">${stages.length > 1 || group.length > 1
      ? `<p class="stagelabel">Stage ${i + 1}${group.length > 1 ? ' · side by side' : ''}</p>` : ''}${group.map(({ step, index }) => {
      const provider = officeStore.agents.find(a => a.id === step.agentId)?.provider;
      return `<section class="outputstep ${provider === 'anthropic' ? 'claude' : provider === 'openai' ? 'chatgpt' : ''}"><h4 data-step-head="${index}">${escape(stepLabel(step))}</h4><pre data-step="${index}">${escape(stepText(step))}</pre></section>`;
    }).join('')}</div>`).join('');
}
/** Streams text and progress into the open dialog without replacing its buttons. */
function updateDetailInPlace(task) {
  const output = $('#taskoutput');
  if (output) {
    const atBottom = output.scrollHeight - output.clientHeight - output.scrollTop < 24;
    let grew = false;
    task.steps.forEach((step, index) => {
      const pre = output.querySelector(`[data-step="${index}"]`), head = output.querySelector(`[data-step-head="${index}"]`);
      const text = stepText(step), label = stepLabel(step);
      if (pre && pre.textContent !== text) { pre.textContent = text; grew = true; }
      if (head && head.textContent !== label) head.textContent = label;
    });
    if (grew && atBottom) output.scrollTop = output.scrollHeight;
  }
  const bar = $('#detailbody .progress > i');
  if (bar) bar.style.width = task.progress + '%';
  const pct = $('#detailprogress');
  if (pct) pct.textContent = task.progress + '%';
}
detailContent = function () {
  if (!officeStore.live) { detailKey = null; $('#detail').classList.remove('wide'); return demoDetailContent(); }
  const agent = liveAgent();
  if (!agent) { $('#detail').close(); return; }
  if (agent.provider === 'external') return externalDetail(agent);
  const task = selectedTask();
  // Rebuilding the markup replaces the buttons, and a click whose press and
  // release land on different elements never fires. So rebuild only when
  // something the buttons depend on changes; stream everything else in place.
  const key = JSON.stringify([agent.id, agent.name, agent.role, agent.mock, agent.status, task?.id, task?.title,
    task?.status, officeStore.connected, mutationPending]);
  if (key === detailKey && $('#detailbody [data-live-detail]')) {
    if (task) updateDetailInPlace(task);
    return;
  }
  detailKey = key;
  const previous = $('#taskoutput');
  const scroll = previous?.scrollTop || 0;
  const atBottom = !previous || previous.scrollHeight - previous.clientHeight - scroll < 24;
  const draft = $('#revisionfeedback');
  if (draft) revisionDrafts.set(draft.dataset.task, draft.value);
  const cursor = draft && document.activeElement === draft ? [draft.selectionStart, draft.selectionEnd] : null;
  const reviewing = task?.status === 'review';
  const running = task && ['queued','in_progress'].includes(task.status);
  const disabled = !officeStore.connected || mutationPending ? 'disabled' : '';
  $('#detailbody').innerHTML = `<button class="close" aria-label="Close" data-live-detail>×</button><span class="detailavatar">🤖</span>
    <h2>${escape(agent.name)} ${agent.mock ? '<span class="tag">MOCK</span>' : ''}</h2>
    <p class="muted">${escape(agent.role)} · ${escape(agent.status)}</p>
    ${task ? `<div class="detailtask"><span class="eyebrow">${escape(task.status)}</span><p>${escape(task.title)}</p>
      <div class="progress"><i style="width:${task.progress}%"></i></div><span class="small" id="detailprogress">${task.progress}%</span></div>
      <h3>Task output${task.steps.some(step => officeStore.agents.find(a => a.id === step.agentId)?.mock) ? ' · simulated' : ''}</h3><div id="taskoutput" tabindex="0">${outputMarkup(task)}</div>` : '<p>Ready for a new assignment.</p>'}
    ${reviewing ? `<label for="revisionfeedback">Revision notes</label><textarea id="revisionfeedback" data-task="${escape(task.id)}" maxlength="4000" placeholder="What should change?">${escape(revisionDrafts.get(task.id) || '')}</textarea>` : ''}
    <div class="detailactions">${reviewing ? `<button class="primary" id="approve" ${disabled}>✓ Approve task</button><button class="secondary" id="revise" ${disabled}>Request revision</button>` : running ? `<button class="secondary" id="canceltask" ${disabled}>Stop task</button>` : agent.status === 'idle' ? `<button class="primary" id="assignselected" ${disabled}>＋ Assign a task</button>` : ''}</div>`;
  // Multi-agent tasks get a wider dialog so parallel outputs can sit side by side.
  $('#detail').classList.toggle('wide', !!task && task.steps.length > 1);
  const output = $('#taskoutput');
  if (output) output.scrollTop = atBottom ? output.scrollHeight : scroll;
  if (cursor && $('#revisionfeedback')) { $('#revisionfeedback').focus(); $('#revisionfeedback').setSelectionRange(...cursor); }
};
// Suite for an external agent, by the kind it reported (server stores it as the model); other kinds aren't placed.
const externalSuite = agent => agent.provider !== 'external' ? null
  : agent.model === 'codex' ? 'Codex' : agent.model === 'claude-code' ? 'Claude Code' : null;
function externalDetail(agent) {
  const key = JSON.stringify(['external', agent.id, agent.name, agent.status, agent.activity, agent.lastActiveAt]);
  if (key === detailKey && $('#detailbody [data-live-detail]')) return;
  detailKey = key;
  $('#detail').classList.remove('wide');
  $('#detailbody').innerHTML = `<button class="close" aria-label="Close" data-live-detail>×</button><span class="detailavatar">${escape(agent.avatar || '🤖')}</span>
    <h2>${escape(agent.name)}</h2><p class="muted">${escape(agent.role)} · ${escape(agent.status)}</p>
    <div class="detailtask"><span class="eyebrow">REPORTED BY THE TOOL ITSELF</span><p>${escape(agent.activity || 'No activity reported yet.')}</p>
    ${agent.lastActiveAt ? `<span class="small">Last report ${escape(new Date(agent.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}</span>` : ''}</div>
    <p class="small">This desk shows what the tool reports through <code>scripts/report-activity.mjs</code>. The office can't assign it tasks.</p>`;
}
function projectSnapshot() {
  agents = initial.map(robot => {
    const agent = officeStore.agents.find(agent => agent.id === robot.id);
    if (!agent) return { ...robot, state: 'offline', task: 'Not present on the server', progress: 0 };
    const task = OfficeLiveState.taskFor(officeStore, agent);
    // app.js interpolates role into markup unescaped.
    return { ...robot, state: agent.status, role: escape(agent.role) + (agent.mock ? ' · MOCK' : ''),
      task: agent.activity || (task ? `${task.title} · ${task.status}` : 'Ready for a new assignment'), progress: task?.progress || 0 };
  });
  // Coding agents (Codex, Claude Code) that report their own activity get a robot in their suite while online.
  const suiteTeams = {};
  for (const agent of officeStore.agents) {
    const department = externalSuite(agent);
    if (!department || agent.status === 'offline') continue;
    const slot = (suiteTeams[department] = (suiteTeams[department] || 0) + 1) - 1;
    deskSlots[agent.id] = slot % 3;
    // app.js interpolates names and roles into markup unescaped; these come from whatever the tool reported.
    agents.push({ id: agent.id, name: escape(agent.name), role: escape(agent.role), department, emoji: agent.avatar || '🤖',
      external: true, state: agent.status, task: agent.activity || 'No activity reported yet', progress: 0 });
  }
  completed = officeStore.tasks.filter(task => task.status === 'done').length;
  events = officeStore.activity.slice(0, 5).map(entry => ({ name: 'Office', text: entry.message,
    time: new Date(entry.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }));
  render();
}
async function postTask(path, body = {}) {
  if (!officeStore.connected) throw new Error('Wait for the server connection to return.');
  if (mutationPending) throw new Error('A task request is already in progress.');
  mutationPending = true;
  render();
  try {
    const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
    // SSE remains the sole source of state, avoiding HTTP/SSE ordering races.
    return result;
  } finally { mutationPending = false; render(); }
}
document.addEventListener('click', async event => {
  if (!officeStore.live) return;
  const id = event.target.closest('button')?.id;
  if (!['approve','revise','canceltask','reset','pause'].includes(id)) return;
  event.stopImmediatePropagation();
  if (id === 'reset') return;
  if (id === 'pause') { paused = !paused; document.body.classList.toggle('paused', paused); connectionLabels(); return; }
  const task = selectedTask();
  if (!task) return;
  const feedback = $('#revisionfeedback')?.value.trim();
  if (id === 'revise' && !feedback) { notify('Add revision notes first.'); $('#revisionfeedback').focus(); return; }
  try {
    await postTask(`/api/tasks/${encodeURIComponent(task.id)}/${{approve:'approve',revise:'revise',canceltask:'cancel'}[id]}`, id === 'revise' ? { feedback } : {});
    revisionDrafts.delete(task.id);
    notify(id === 'approve' ? 'Task approved.' : id === 'revise' ? 'Revision requested.' : 'Task stopped.');
  } catch (error) { notify(error.message); }
}, true);
// Workflow picker: in live mode a task can go to one teammate or to one of the
// server's workflows (e.g. Claude and ChatGPT side by side, then a comparison).
const demoOpenTask = openTask;
function describeWorkflowChoice() {
  const workflow = officeStore.workflows.find(w => w.id === $('#workflowselect').value);
  $('#agentfield').hidden = !!workflow;
  $('#agentselect').required = !workflow;
  $('#workflowinfo').textContent = workflow
    ? `${workflow.description} ${OfficeLiveState.describeStages(officeStore, workflow.stages)}.`
    : 'One available teammate works on it alone.';
  $('#taskform button[type="submit"]').textContent = workflow ? 'Start the workflow ↗' : 'Send to their desk ↗';
}
openTask = function (id) {
  // While connecting, the page doesn't yet know whether assignments go to the server or the demo.
  if (document.body.classList.contains('connecting')) { notify('Connecting to the office…'); return; }
  if (!officeStore.live) return demoOpenTask(id);
  const available = agents.filter(a => a.state === 'idle' && !a.external);
  if (!available.length && !officeStore.workflows.length) { notify('All desks are busy. Approve or stop a task first.'); return; }
  $('#agentselect').innerHTML = available.map(a => `<option value="${a.id}">${a.name} · ${a.department} / ${a.role}</option>`).join('');
  if (id && available.some(a => a.id === id)) $('#agentselect').value = id;
  // Workflows queue behind busy agents on the server, so they stay available when every desk is taken.
  $('#workflowselect').innerHTML = `<option value="" ${available.length ? '' : 'disabled'}>One teammate${available.length ? '' : ' (all busy)'}</option>` +
    officeStore.workflows.map(w => `<option value="${escape(w.id)}">${escape(w.name)}</option>`).join('');
  $('#workflowselect').value = available.length || !officeStore.workflows.length ? '' : officeStore.workflows[0].id;
  $('#workflowfield').hidden = !officeStore.workflows.length;
  $('#tasktext').maxLength = 2000;
  $('#tasktext').value = '';
  describeWorkflowChoice();
  $('#taskdialog').showModal();
};
$('#workflowselect').onchange = describeWorkflowChoice;
/** Opens the task dialog on a task the server just created, before its first SSE event may have arrived. */
function openTaskDialog(task) {
  // Insert only if absent: every later SSE task event replaces this copy, so it can't go stale.
  if (!officeStore.tasks.some(t => t.id === task.id)) officeStore.tasks.push(task);
  selected = task.steps[0].agentId; reviewTaskId = task.id; detailKey = null;
  detailContent(); $('#detail').showModal();
}
const demoSubmit = $('#taskform').onsubmit;
$('#taskform').onsubmit = async event => {
  if (!officeStore.live) return demoSubmit(event);
  event.preventDefault();
  const agentId = $('#agentselect').value;
  const prompt = $('#tasktext').value.trim();
  if (!prompt) return;
  const workflowId = $('#workflowfield').hidden ? '' : $('#workflowselect').value;
  if (workflowId) {
    try {
      const task = await postTask('/api/tasks', { prompt, workflowId });
      $('#taskdialog').close();
      openTaskDialog(task);
      notify('Workflow started on the server.');
    } catch (error) { notify(error.message); }
    return;
  }
  if (officeStore.agents.find(agent => agent.id === agentId)?.status !== 'idle') {
    notify('That teammate is no longer available. Choose another teammate.');
    return;
  }
  try {
    await postTask('/api/tasks', { prompt, stages: [[agentId]] });
    $('#taskdialog').close();
    openAgent(agentId);
    notify('Task assigned to the server.');
  } catch (error) { notify(error.message); }
};
// Until the first snapshot arrives, or the connection fails, the page can't tell the live office from the static
// demo, so index.html hides the simulated data behind "CONNECTING…". A static host (no /api/events) fails fast and
// shows the demo; index.html's 1.5 s timeout covers a server that never answers.
const revealOffice = () => document.body.classList.remove('connecting');
if (typeof EventSource === 'undefined') revealOffice();
else {
  const feed = new EventSource('/api/events');
  // Streaming sends a delta per token. Re-rendering the whole office for each
  // one froze frames and swallowed clicks, so deltas only refresh the open
  // dialog's output, and everything is batched to one update per frame.
  let fullFrame = false, outputFrame = false;
  const flush = () => {
    const full = fullFrame;
    fullFrame = outputFrame = false;
    if (full) { projectSnapshot(); return revealOffice(); }
    const task = $('#detail').open && selectedTask();
    if (task) updateDetailInPlace(task);
  };
  const schedule = full => {
    const pending = fullFrame || outputFrame;
    if (full) fullFrame = true; else outputFrame = true;
    if (!pending) requestAnimationFrame(flush);
  };
  feed.onmessage = event => {
    try {
      const data = JSON.parse(event.data);
      // First snapshot: drop the demo robots so they appear at their live spots instead of walking over from demo desks.
      if (data.type === 'snapshot' && !officeStore.live) resetScene();
      OfficeLiveState.receive(officeStore, data);
      if (officeStore.live) schedule(data.type !== 'delta');
    } catch (error) { console.error('Invalid office event', error); }
  };
  feed.onerror = () => { officeStore.connected = false; if (officeStore.live) render(); else revealOffice(); };
}
