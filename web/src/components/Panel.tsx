import { useEffect, type ReactNode } from "react";

export function Panel({ title, onClose, children }: { title: ReactNode; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="panel-backdrop" onClick={onClose}>
      <div className="panel" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="panel-head">
          <h2>{title}</h2>
          <button className="icon" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="panel-body">{children}</div>
      </div>
    </div>
  );
}
