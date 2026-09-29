import { createApp } from "./app.js";
import { Office } from "./office/office.js";
import { defaultRoster, defaultWorkflows } from "./office/roster.js";
import { createProviderRegistry } from "./providers/index.js";

const office = new Office(defaultRoster(), defaultWorkflows, createProviderRegistry());
const port = Number(process.env.PORT) || 8787;

createApp(office).listen(port, () => {
  const agents = office.snapshot().agents;
  console.log(`AI Agent Office listening on http://localhost:${port}`);
  for (const a of agents) {
    console.log(`  ${a.avatar}  ${a.name.padEnd(6)} ${a.role.padEnd(11)} ${a.provider}/${a.model}${a.mock ? "  (mock)" : ""}`);
  }
});
