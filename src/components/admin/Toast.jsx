import { useCallback, useEffect, useState } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((type, message) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []); // stable — setToasts from useState never changes

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
}

export function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <ToastBubble key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastBubble({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 16);
    const dismiss = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 350);
    }, 3000);
    return () => {
      clearTimeout(show);
      clearTimeout(dismiss);
    };
  }, []);

  const isSuccess = toast.type === "success";
  const bg = isSuccess ? "bg-emerald-500" : "bg-red-500";
  const Icon = isSuccess ? CheckCircle : XCircle;

  return (
    <div
      className={`${bg} text-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg min-w-[280px] pointer-events-auto`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(120%)",
        transition: "opacity 350ms ease, transform 350ms ease",
      }}
      role="status"
      aria-live="polite"
    >
      <Icon size={18} className="shrink-0" />
      <span className="text-sm font-medium flex-1">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-white/50 rounded"
        aria-label="Dismiss notification"
      >
        <X size={15} />
      </button>
    </div>
  );
}
