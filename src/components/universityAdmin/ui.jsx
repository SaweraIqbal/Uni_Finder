import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useUniversityAdmin } from "./UniversityAdminContext";

const statusMap = {
  verified: {
    dot: "bg-green-500",
    text: "text-green-700",
    bg: "bg-green-50",
    label: "Verified",
  },
  auto_approved: {
    dot: "bg-green-500",
    text: "text-green-700",
    bg: "bg-green-50",
    label: "Auto-Approved",
  },
  manually_approved: {
    dot: "bg-green-500",
    text: "text-green-700",
    bg: "bg-green-50",
    label: "Manually Approved",
  },
  pending: {
    dot: "bg-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50",
    label: "Pending",
  },
  forwarded: {
    dot: "bg-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50",
    label: "Forwarded",
  },
  revision_requested: {
    dot: "bg-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50",
    label: "Revision Requested",
  },
  link_sent: {
    dot: "bg-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50",
    label: "Link Sent",
  },
  rejected: {
    dot: "bg-red-500",
    text: "text-red-700",
    bg: "bg-red-50",
    label: "Rejected",
  },
};

export function StatusChip({ status, label }) {
  const cfg = statusMap[status] ?? statusMap.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {label ?? cfg.label}
    </span>
  );
}

export function Tooltip({ text, children }) {
  return (
    <div className="relative group inline-flex">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg max-w-64 text-center leading-relaxed">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
      </div>
    </div>
  );
}

const variantClass = {
  primary: "bg-orange-500 hover:bg-orange-600 text-white",
  secondary: "bg-white hover:bg-gray-50 text-slate-700 border border-slate-200",
  danger: "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200",
};

export function GatedButton({
  onClick,
  disabled,
  tooltipText,
  className = "",
  children,
  variant = "primary",
}) {
  const classes = variantClass[variant] || variantClass.primary;

  if (disabled && tooltipText) {
    return (
      <Tooltip text={tooltipText}>
        <button
          type="button"
          disabled
          className={`px-4 py-2 rounded-xl text-sm font-medium cursor-not-allowed opacity-40 ${classes} ${className}`}
        >
          {children}
        </button>
      </Tooltip>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${classes} ${className} ${
        disabled ? "opacity-40 cursor-not-allowed" : ""
      }`}
    >
      {children}
    </button>
  );
}

export function SideSheet() {
  const { sideSheet, closeSideSheet } = useUniversityAdmin();

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeSideSheet();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeSideSheet]);

  if (!sideSheet) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={closeSideSheet}
      />
      <div className="relative bg-white w-full max-w-xl h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">
            {sideSheet.title}
          </h2>
          <button
            type="button"
            onClick={closeSideSheet}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{sideSheet.body}</div>
      </div>
    </div>
  );
}

export function EmptyState({ message, icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-4">{icon ?? "🎉"}</div>
      <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
        {message}
      </p>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function VerificationGateBanner({ onNavigate }) {
  return (
    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-800">
          Approvals are disabled until university verification is complete.
        </p>
        <button
          type="button"
          onClick={onNavigate}
          className="text-sm text-amber-700 underline mt-1 hover:text-amber-900"
        >
          Complete verification on the University Profile page →
        </button>
      </div>
    </div>
  );
}

export function TabBar({ tabs, activeTab, onChange }) {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-full sm:w-fit mb-6 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          type="button"
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === tab.id
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full tabular-nums ${
                activeTab === tab.id
                  ? "bg-orange-100 text-orange-700"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Modal({ title, onClose, children, footer }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && (
          <div className="border-t border-slate-100 px-6 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}

export function Input({ label, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-700">{label}</label>
      )}
      <input
        {...props}
        className={`px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all ${className}`}
      />
    </div>
  );
}

export function Select({ label, children, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-700">{label}</label>
      )}
      <select
        {...props}
        className={`px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all bg-white ${className}`}
      >
        {children}
      </select>
    </div>
  );
}

export function Textarea({ label, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-700">{label}</label>
      )}
      <textarea
        {...props}
        className={`px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all resize-none ${className}`}
      />
    </div>
  );
}

export function RejectionModal({ onClose, onSubmit, title }) {
  const [reason, setReason] = useState("");
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => reason.trim() && onSubmit(reason)}
            disabled={!reason.trim()}
            className="px-4 py-2 text-sm rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Confirm Rejection
          </button>
        </div>
      }
    >
      <Textarea
        label="Rejection reason (required)"
        placeholder="Provide a clear reason for rejection..."
        rows={4}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
    </Modal>
  );
}

export function HecBadge({ source }) {
  if (source === "hec_auto") {
    return (
      <Tooltip text="Auto-approved based on HEC master data.">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 cursor-help">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          HEC Verified
        </span>
      </Tooltip>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      Manual Proof Required
    </span>
  );
}

export function SystemRec({ rec, verificationBlocked }) {
  if (verificationBlocked) {
    return (
      <p className="text-xs text-red-600">
        <strong>Approve disabled:</strong> University verification incomplete.
        Complete verification first.
      </p>
    );
  }
  if (rec === "auto_approve") {
    return (
      <p className="text-xs text-green-700">
        <strong>Auto-approve eligible</strong> — program verified, campus
        HEC-verified.
      </p>
    );
  }
  return (
    <p className="text-xs text-amber-700">
      <strong>Manual review</strong> — campus not yet HEC-verified.
    </p>
  );
}

export function StatCard({ label, value, sub, icon, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-start gap-4 w-full text-left ${
        onClick ? "hover:shadow-md transition-shadow cursor-pointer" : ""
      }`}
    >
      {icon && (
        <div className="p-3 rounded-xl bg-orange-50 text-orange-600 shrink-0">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </Tag>
  );
}

export function formatDate(iso) {
  return new Intl.DateTimeFormat("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatShortDate(iso) {
  return new Intl.DateTimeFormat("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

export function InfoBanner({ children }) {
  return (
    <div className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-500 leading-relaxed">
      <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
      {children}
    </div>
  );
}

export function SuccessIcon() {
  return <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />;
}
