import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import "../styles/StoreTypeDialog.css";

export default function StoreTypeDialog({ title, children, variant = "success", confirmLabel = "OK", onConfirm, onClose, busy = false }) {
  const ref = useRef(null);
  const titleId = useId();
  const bodyId = useId();
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => { document.body.style.overflow = overflow; previous?.focus?.(); };
  }, []);
  function handleKey(event) {
    if (event.key === "Escape") { event.preventDefault(); if (!busy) onClose(); }
    if (event.key === "Tab") {
      const buttons = [...ref.current.querySelectorAll("button:not(:disabled)")];
      if (!buttons.length) { event.preventDefault(); return; }
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { event.preventDefault(); first.focus(); }
    }
  }
  return createPortal(
    <div className="store-master-dialog-overlay" onClick={() => { if (!busy) onClose(); }}>
      <section ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={bodyId} aria-busy={busy}
        className={"store-master-dialog " + variant} onKeyDown={handleKey} onClick={event => event.stopPropagation()}>
        <div className="store-master-dialog-icon" aria-hidden="true"><i className={"bi " + (variant === "success" ? "bi-check-circle" : variant === "confirm" ? "bi-slash-circle" : "bi-exclamation-circle")} /></div>
        <h2 id={titleId}>{title}</h2>
        <div id={bodyId} className="store-master-dialog-message">{children}</div>
        <div className="store-master-dialog-actions">
          {variant === "confirm" && <button type="button" className="secondary" disabled={busy} onClick={onClose}>Cancel</button>}
          <button type="button" className="primary" disabled={busy} onClick={onConfirm || onClose}>{busy ? "Please wait..." : confirmLabel}</button>
        </div>
      </section>
    </div>, document.body
  );
}
