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
      // The server lists activity oldest first; the store keeps newest first.
      store.activity = store.activity.reverse().slice(0, 100);
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
  const providerName = provider => ({ anthropic: 'Claude', openai: 'ChatGPT' })[provider] || 'External';
  /** A task's steps grouped by stage; agents within a stage worked side by side. */
  function stagesOf(task) {
    const stages = [];
    task.steps.forEach((step, index) => { (stages[step.stage] ||= []).push({ step, index }); });
    return stages.filter(Boolean);
  }
  /** "Stage 1: Quill (Claude) + Atlas (ChatGPT) → Stage 2: Orbit (Claude)" for a workflow's stages of agent ids. */
  function describeStages(store, stages) {
    return stages.map((ids, i) => `Stage ${i + 1}: ` + ids.map(id => {
      const agent = store.agents.find(agent => agent.id === id);
      return agent ? `${agent.name} (${providerName(agent.provider)})` : id;
    }).join(' + ')).join(' → ');
  }
  const api = { createStore, receive, taskFor, providerName, stagesOf, describeStages };
  if (typeof module !== 'undefined') module.exports = api;
  else root.OfficeLiveState = api;
})(globalThis);
