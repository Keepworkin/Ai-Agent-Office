import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { Office } from "./office/office.js";
import { defaultRoster, defaultWorkflows } from "./office/roster.js";
import { fileStore } from "./office/store.js";
import { createProviderRegistry } from "./providers/index.js";

// Tasks and activity survive restarts in server/data/office.json (git-ignored). OFFICE_DATA_FILE moves it; "off" disables it.
const dataFile = process.env.OFFICE_DATA_FILE || fileURLToPath(new URL("../data/office.json", import.meta.url));
const store = dataFile === "off" ? undefined : fileStore(dataFile);
const office = new Office(defaultRoster(), defaultWorkflows, createProviderRegistry(), store);
const port = Number(process.env.PORT) || 8787;

// Save anything still pending before the process goes away (Ctrl+C, or tsx restarting on a file change).
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    office.flush();
    process.exit(0);
  });
}

createApp(office).listen(port, () => {
  const agents = office.snapshot().agents;
  console.log(`AI Agent Office listening on http://localhost:${port}`);
  console.log(store ? `  Saving tasks and activity to ${dataFile}` : "  Not saving tasks (OFFICE_DATA_FILE=off)");
  for (const a of agents) {
    console.log(`  ${a.avatar}  ${a.name.padEnd(6)} ${a.role.padEnd(11)} ${a.provider}/${a.model}${a.mock ? "  (mock)" : ""}`);
  }
});
