import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ActivityEntry, AgentState, Task } from "../types.js";

/**
 * What survives a server restart: tasks, the activity log and each office agent's stats. Live output streams,
 * queues and external agents (which re-register on their next report) don't; see Office.restore.
 */
export interface SavedOffice {
  version: 1;
  savedAt: string;
  tasks: Task[];
  activity: ActivityEntry[];
  stats: Record<string, AgentState["stats"]>;
}

export interface OfficeStore {
  load(): SavedOffice | null;
  save(state: SavedOffice): void;
}

/** Keeps the office in one JSON file. Task prompts and outputs are private, so the file stays out of git. */
export function fileStore(file: string, warn: (message: string) => void = console.warn): OfficeStore {
  return {
    load() {
      if (!existsSync(file)) return null;
      try {
        const data = JSON.parse(readFileSync(file, "utf8"));
        if (data?.version !== 1 || !Array.isArray(data.tasks) || !Array.isArray(data.activity)) {
          throw new Error("unrecognised format");
        }
        return { ...data, stats: data.stats ?? {} } as SavedOffice;
      } catch (err) {
        // Keep the unreadable file for inspection and start fresh rather than refusing to boot.
        const aside = `${file}.unreadable-${Date.now()}`;
        try { renameSync(file, aside); } catch { /* leave it in place */ }
        warn(`Office data in ${file} couldn't be read (${(err as Error).message}); moved it to ${aside} and started fresh.`);
        return null;
      }
    },
    save(state) {
      mkdirSync(path.dirname(file), { recursive: true });
      // Write then rename, so a crash mid-write never leaves half a file behind.
      const tmp = `${file}.tmp`;
      writeFileSync(tmp, JSON.stringify(state));
      renameSync(tmp, file);
    },
  };
}
