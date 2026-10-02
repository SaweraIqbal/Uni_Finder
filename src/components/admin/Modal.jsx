import { useEffect, useRef, useState } from "react";

export default function Modal({
  open,
  onClose,
  children,
  maxWidth = "max-w-lg",
}) {
  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);
  const prevFocusRef = useRef(null);
  const modalRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (open) {
      prevFocusRef.current = document.activeElement;
      setRendered(true);
      const t = setTimeout(() => setVisible(true), 16);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
      const t = setTimeout(() => {
        setRendered(false);
        prevFocusRef.current?.focus();
        prevFocusRef.current = null;
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Auto-focus first element
  useEffect(() => {
    if (!visible || !modalRef.current) return;
    const el = modalRef.current.querySelector(
      'button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    el?.focus();
  }, [visible]);

  // ESC key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Focus trap
  useEffect(() => {
    if (!visible || !modalRef.current) return;
    const modal = modalRef.current;
    const handler = (e) => {
      if (e.key !== "Tab") return;
      const focusable = Array.from(
        modal.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [visible]);

  if (!rendered) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/50"
        style={{ opacity: visible ? 1 : 0, transition: "opacity 200ms ease" }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} z-10 max-h-[90vh] overflow-y-auto`}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(0.95)",
          transition: "opacity 200ms ease, transform 200ms ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}
