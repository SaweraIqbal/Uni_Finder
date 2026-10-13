/**
 * ui.jsx — shared micro-components for Campus Admin Dashboard
 * StatusPill, Card, PrimaryBtn, SecondaryBtn, DangerBtn, Toggle,
 * FormInput, FormSelect, FormTextarea, ConfirmModal, Toast
 */
import { useState } from "react";
import { Check, X } from "lucide-react";

/* ─── Status Pill ─────────────────────────────────────────────────────────── */
const PILL_VARIANTS = {
  success:  { bg: "bg-green-100",  dot: "bg-green-500",  text: "text-green-700"  },
  pending:  { bg: "bg-amber-100",  dot: "bg-amber-500",  text: "text-amber-700"  },
  rejected: { bg: "bg-red-100",    dot: "bg-red-500",    text: "text-red-700"    },
  draft:    { bg: "bg-gray-100",   dot: "bg-gray-400",   text: "text-gray-600"   },
};

export function StatusPill({ variant = "draft", label }) {
  const v = PILL_VARIANTS[variant] || PILL_VARIANTS.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${v.bg} ${v.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${v.dot}`} />
      {label}
    </span>
  );
}

/* ─── Card ────────────────────────────────────────────────────────────────── */
export function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 ${className}`}>
      {children}
    </div>
  );
}

/* ─── Buttons ─────────────────────────────────────────────────────────────── */
export function PrimaryBtn({ children, onClick, disabled, className = "", size = "md", type = "button" }) {
  const sz = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-medium rounded-lg bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed ${sz} ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryBtn({ children, onClick, disabled, className = "", size = "md", type = "button" }) {
  const sz = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-medium rounded-lg bg-white text-slate-700 border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed ${sz} ${className}`}
    >
      {children}
    </button>
  );
}

export function DangerBtn({ children, onClick, disabled, className = "", size = "md", solid = false, type = "button" }) {
  const sz = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  const style = solid
    ? "bg-red-500 text-white hover:bg-red-600 border-transparent"
    : "bg-white text-red-700 border border-red-200 hover:bg-red-50";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed ${style} ${sz} ${className}`}
    >
      {children}
    </button>
  );
}

/* ─── Toggle ─────────────────────────────────────────────────────────────── */
export function Toggle({ checked, onChange, label, disabled }) {
  return (
    <label className="inline-flex items-center gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative inline-flex items-center w-10 h-[22px] rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed ${
          checked ? "bg-orange-500" : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
      {label && <span className="text-sm text-slate-700">{label}</span>}
    </label>
  );
}

/* ─── Form Input ──────────────────────────────────────────────────────────── */
export function FormInput({ label, helper, error, className = "", ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      )}
      <input
        {...props}
        className={`w-full border rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-500 disabled:bg-gray-50 disabled:text-slate-400 ${
          error ? "border-red-400" : "border-gray-200"
        } ${props.className || ""}`}
      />
      {helper && !error && <p className="mt-1 text-xs text-slate-400">{helper}</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

/* ─── Form Select ─────────────────────────────────────────────────────────── */
export function FormSelect({ label, helper, children, className = "", ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      )}
      <select
        {...props}
        className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-500 disabled:bg-gray-50 disabled:text-slate-400 ${props.className || ""}`}
      >
        {children}
      </select>
      {helper && <p className="mt-1 text-xs text-slate-400">{helper}</p>}
    </div>
  );
}

/* ─── Form Textarea ───────────────────────────────────────────────────────── */
export function FormTextarea({ label, helper, className = "", ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      )}
      <textarea
        rows={3}
        {...props}
        className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 resize-y transition-colors focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-500 ${props.className || ""}`}
      />
      {helper && <p className="mt-1 text-xs text-slate-400">{helper}</p>}
    </div>
  );
}

/* ─── Confirm Modal ───────────────────────────────────────────────────────── */
export function ConfirmModal({ title = "Remove this item?", message = "This cannot be undone.", onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10">
        <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
        <p className="text-sm text-slate-500 mb-5">{message}</p>
        <div className="flex items-center justify-end gap-3">
          <SecondaryBtn onClick={onCancel}>Cancel</SecondaryBtn>
          <DangerBtn solid onClick={onConfirm}>Remove</DangerBtn>
        </div>
      </div>
    </div>
  );
}

/* ─── Section Card title row ──────────────────────────────────────────────── */
export function SectionTitle({ number, title, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        {number && (
          <span className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center shrink-0">
            {number}
          </span>
        )}
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      </div>
      {action}
    </div>
  );
}

/* ─── Saved button state helper ───────────────────────────────────────────── */
export function SaveButton({ onClick, busy, saved }) {
  if (saved) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-green-500 text-white opacity-90 cursor-not-allowed"
      >
        <Check className="w-4 h-4" />
        Saved ✓
      </button>
    );
  }
  return (
    <PrimaryBtn onClick={onClick} disabled={busy} type="button">
      {busy ? "Saving…" : "Save Changes"}
    </PrimaryBtn>
  );
}

/* ─── Empty State ─────────────────────────────────────────────────────────── */
export function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
        {Icon ? <Icon className="w-5 h-5 text-gray-400" /> : <span className="text-gray-400 text-xl">—</span>}
      </div>
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}

/* ─── Progress Bar ────────────────────────────────────────────────────────── */
export function ProgressBar({ value, max = 100, className = "" }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className={`w-full bg-slate-100 rounded-full h-2 overflow-hidden ${className}`}>
      <div
        className="h-2 bg-orange-500 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ─── Icon button (pencil / trash / etc.) ─────────────────────────────────── */
export function IconBtn({ children, onClick, danger = false, title, disabled }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-40 disabled:cursor-not-allowed ${
        danger
          ? "text-gray-400 hover:bg-red-50 hover:text-red-500"
          : "text-gray-400 hover:bg-gray-100 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

/* ─── Chip filter button ──────────────────────────────────────────────────── */
export function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors focus:outline-none ${
        active
          ? "bg-orange-500 text-white"
          : "bg-white border border-gray-200 text-slate-600 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}
