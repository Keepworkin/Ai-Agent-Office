/* Shared by the browser adapter and the Node regression tests. */
(function (root) {
  function createStore() {
    return { connected: false, live: false, agents: [], tasks: [], workflows: [], activity: [] };
  }
  function upsert(items, value) {
    const index = items.findIndex(item => item.id === value.id);
    if (index < 0) items.push(value); else items[index] = value;
  }
  function receive(store, event) {
    if (event.type === 'snapshot') {
      Object.assign(store, structuredClone(event.snapshot), { live: true, connected: true });
    } else if (store.live) {
      if (event.type === 'agent') upsert(store.agents, event.agent);
      if (event.type === 'task') upsert(store.tasks, event.task);
      if (event.type === 'activity') store.activity = [event.entry, ...store.activity].slice(0, 100);
      if (event.type === 'delta') {
        const task = store.tasks.find(task => task.id === event.taskId);
        const step = task?.steps.find(step => step.agentId === event.agentId && step.status === 'working');
        if (step) step.output += event.text;
      }
    }
  }
  function taskFor(store, agent) {
    const own = store.tasks.filter(task => task.steps.some(step => step.agentId === agent.id))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return own.find(task => task.id === agent.currentTaskId) || own.find(task =>
      task.status === 'review' && task.steps.some(step => step.agentId === agent.id &&
        step.stage === Math.max(...task.steps.map(step => step.stage)))) || own[0];
  }
  const api = { createStore, receive, taskFor };
  if (typeof module !== 'undefined') module.exports = api;
  else root.OfficeLiveState = api;
})(globalThis);
