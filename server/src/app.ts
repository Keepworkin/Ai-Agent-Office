import express, { type ErrorRequestHandler } from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Office, OfficeError } from "./office/office.js";
import type { OfficeEvent } from "./types.js";

export function createApp(office: Office) {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/office", (_req, res) => {
    res.json(office.snapshot());
  });

  // Server-sent events: a snapshot on connect, then every change as it happens.
  app.get("/api/events", (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    const send = (event: OfficeEvent) => res.write(`data: ${JSON.stringify(event)}\n\n`);
    send({ type: "snapshot", snapshot: office.snapshot() });
    const unsubscribe = office.subscribe(send);
    const heartbeat = setInterval(() => res.write(": ping\n\n"), 25_000);
    req.on("close", () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  });

  app.post("/api/tasks", (req, res) => {
    res.status(201).json(office.createTask(req.body ?? {}));
  });

  app.get("/api/tasks/:id", (req, res) => {
    const task = office.getTask(req.params.id);
    if (!task) throw new OfficeError("task not found", 404);
    res.json(task);
  });

  app.post("/api/tasks/:id/cancel", (req, res) => {
    res.json(office.cancelTask(req.params.id));
  });

  app.post("/api/external/report", (req, res) => {
    res.json(office.reportExternal(req.body ?? {}));
  });

  // In production, serve the built web app from the same origin.
  const webDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../web/dist");
  if (existsSync(webDist)) {
    app.use(express.static(webDist));
    app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(webDist, "index.html")));
  }

  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    const status = err instanceof OfficeError ? err.status : 500;
    if (status === 500) console.error(err);
    res.status(status).json({ error: err instanceof Error ? err.message : "internal error" });
  };
  app.use(onError);

  return app;
}
