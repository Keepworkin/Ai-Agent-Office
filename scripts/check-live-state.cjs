const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createStore, receive, taskFor } = require('../dist/live-state.js');
const agent = { id: 'atlas', currentTaskId: 'task-1' };
const task = { id: 'task-1', createdAt: '2026-09-28', status: 'in_progress', steps: [{ agentId: 'atlas', stage: 0, status: 'working', output: '' }] };
const snapshot = () => ({ type: 'snapshot', snapshot: { agents: [agent], tasks: [task], workflows: [], activity: [] } });
test('static fallback ends only after snapshot; reconnect replaces stale state', () => {
  const state = createStore();
  receive(state, { type: 'task', task });
  assert.equal(state.live, false);
  receive(state, snapshot());
  assert.equal(state.connected, true);
  state.connected = false;
  assert.equal(state.live, true);
  receive(state, { type: 'snapshot', snapshot: { agents: [], tasks: [], workflows: [], activity: [] } });
  assert.deepEqual(state.tasks, []);
  assert.equal(state.connected, true);
});
test('delta accumulates output and authoritative task event replaces it without duplication', () => {
  const state = createStore(); receive(state, snapshot());
  receive(state, { type: 'delta', agentId: 'atlas', taskId: 'task-1', text: 'Hello' });
  assert.equal(state.tasks[0].steps[0].output, 'Hello');
  receive(state, { type: 'task', task: { ...task, steps: [{ ...task.steps[0], output: 'Hello world', status: 'done' }] } });
  assert.equal(state.tasks[0].steps[0].output, 'Hello world');
  receive(state, { type: 'delta', agentId: 'atlas', taskId: 'missing', text: 'stale' });
  assert.equal(state.tasks.length, 1);
});
test('review lookup only selects final-stage agent; active assignment wins', () => {
  const state = createStore(); receive(state, snapshot());
  const review = { ...task, id: 'review', status: 'review', createdAt: '2026-09-27', steps: [{agentId:'atlas',stage:0},{agentId:'sage',stage:1}] };
  receive(state, { type: 'task', task: review });
  assert.equal(taskFor(state, agent).id, 'task-1');
  assert.equal(taskFor(state, {id:'sage'}).id, 'review');
  assert.equal(taskFor(state, {id:'atlas'}).id, 'task-1');
});
test('agent and activity events update without adding duplicate agents', () => {
  const state = createStore(); receive(state, snapshot());
  receive(state, { type:'agent', agent:{...agent,status:'review'} });
  receive(state, { type:'activity', entry:{id:'event',message:'Ready'} });
  assert.equal(state.agents.length, 1);
  assert.equal(state.agents[0].status, 'review');
  assert.equal(state.activity[0].message, 'Ready');
});
