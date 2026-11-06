/**
 * UniversityNotFoundModal.jsx
 *
 * A polished dialog shown when a university admin cannot find their institution
 * in the UniFinder database. Collects their name, email, the missing university
 * name, and optional notes, then POSTs to /api/contact/university-not-found.
 *
 * Props:
 *   isOpen        {boolean}         — controls visibility
 *   onClose       {() => void}      — called when the modal should close
 *   defaultName   {string}          — pre-fill from the parent form
 *   defaultEmail  {string}          — pre-fill from the parent form
 *   searchQuery   {string}          — pre-fill universityName from what the user typed
 */

import { useEffect, useRef, useState } from "react";
import { reportMissingUniversity } from "../../api/client";

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const INPUT_CLS =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#c88410] focus:bg-white focus:ring-2 focus:ring-[#c88410]/20";

const INPUT_ERROR_CLS =
  "w-full rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-200";

const clean = (v) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "");

function validate(fields) {
  const errors = {};
  if (!clean(fields.name) || clean(fields.name).length < 2)
    errors.name = "Please enter your full name.";
  if (!clean(fields.email) || !EMAIL_RE.test(clean(fields.email)))
    errors.email = "Please enter a valid email address.";
  if (!clean(fields.universityName) || clean(fields.universityName).length < 3)
    errors.universityName = "Please enter the university name.";
  if (fields.message && clean(fields.message).length > 500)
    errors.message = "Keep this under 500 characters.";
  return errors;
}

export default function UniversityNotFoundModal({
  isOpen,
  onClose,
  defaultName = "",
  defaultEmail = "",
  searchQuery = "",
}) {
  const [fields, setFields] = useState({
    name: "",
    email: "",
    universityName: "",
    message: "",
  });
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  const firstInputRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setFields({
        name: defaultName || "",
        email: defaultEmail || "",
        universityName: searchQuery || "",
        message: "",
      });
      setTouched({});
      setServerError("");
      setSuccess(false);
      // Focus first empty field on next paint
      setTimeout(() => firstInputRef.current?.focus(), 60);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const allErrors = validate(fields);
  const fieldError = (key) => (touched[key] ? allErrors[key] : undefined);

  const set = (key) => (e) => {
    setFields((prev) => ({ ...prev, [key]: e.target.value }));
    setServerError("");
  };
  const blur = (key) => () => setTouched((prev) => ({ ...prev, [key]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Touch all fields to reveal errors
    setTouched({ name: true, email: true, universityName: true, message: true });

    if (Object.keys(validate(fields)).length > 0) return;

    setSubmitting(true);
    setServerError("");

    try {
      const { ok, data } = await reportMissingUniversity({
        name: clean(fields.name),
        email: clean(fields.email).toLowerCase(),
        universityName: clean(fields.universityName),
        message: clean(fields.message),
      });

      if (ok) {
        setSuccess(true);
      } else {
        // Surface field-level errors returned by the server
        if (data?.errors) {
          const firstMsg = Object.values(data.errors)[0];
          setServerError(firstMsg);
        } else {
          setServerError(data?.message || "Something went wrong. Please try again.");
        }
      }
    } catch {
      setServerError("Network error — please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!isOpen) return null;

  if (success) {
    return (
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-success-title"
      >
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-8 text-center animate-in fade-in zoom-in-95 duration-200">
          {/* Animated checkmark */}
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 id="modal-success-title" className="text-xl font-semibold text-gray-900 mb-2">
            Request received!
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-1">
            We've forwarded your request to our team and sent a confirmation to{" "}
            <span className="font-medium text-gray-700">{clean(fields.email)}</span>.
          </p>
          <p className="text-sm text-gray-500 leading-relaxed mb-7">
            We'll review and respond within <strong>2–3 business days</strong>.
          </p>
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-[#c88410] py-2.5 text-sm font-semibold text-white hover:bg-[#a86e0d] active:bg-[#8f5e0b] transition-colors focus:outline-none focus:ring-2 focus:ring-[#c88410]/50"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between bg-gradient-to-r from-[#c88410] to-[#a86e0d] px-6 py-5">
          <div>
            <h2 id="modal-title" className="text-base font-semibold text-white">
              University not listed?
            </h2>
            <p className="mt-0.5 text-xs text-amber-100">
              Let us know and we'll add it within 2–3 business days.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="ml-4 mt-0.5 rounded-lg p-1.5 text-amber-200 hover:bg-white/20 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Form body ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate className="px-6 py-5 space-y-4">

          {/* Full name */}
          <div>
            <label htmlFor="umnf-name" className="mb-1.5 block text-xs font-medium text-gray-700">
              Your Name <span className="text-red-500">*</span>
            </label>
            <input
              id="umnf-name"
              ref={firstInputRef}
              type="text"
              autoComplete="name"
              maxLength={80}
              value={fields.name}
              onChange={set("name")}
              onBlur={blur("name")}
              placeholder="e.g. Dr. Sara Khan"
              className={fieldError("name") ? INPUT_ERROR_CLS : INPUT_CLS}
              aria-invalid={Boolean(fieldError("name"))}
              aria-describedby={fieldError("name") ? "umnf-name-error" : undefined}
            />
            {fieldError("name") && (
              <p id="umnf-name-error" className="mt-1.5 text-xs text-red-600">{fieldError("name")}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="umnf-email" className="mb-1.5 block text-xs font-medium text-gray-700">
              Your Email <span className="text-red-500">*</span>
            </label>
            <input
              id="umnf-email"
              type="email"
              autoComplete="email"
              maxLength={254}
              value={fields.email}
              onChange={set("email")}
              onBlur={blur("email")}
              placeholder="name@university.edu.pk"
              className={fieldError("email") ? INPUT_ERROR_CLS : INPUT_CLS}
              aria-invalid={Boolean(fieldError("email"))}
              aria-describedby={fieldError("email") ? "umnf-email-error" : undefined}
            />
            {fieldError("email") && (
              <p id="umnf-email-error" className="mt-1.5 text-xs text-red-600">{fieldError("email")}</p>
            )}
          </div>

          {/* University name */}
          <div>
            <label htmlFor="umnf-uni" className="mb-1.5 block text-xs font-medium text-gray-700">
              University Name <span className="text-red-500">*</span>
            </label>
            <input
              id="umnf-uni"
              type="text"
              maxLength={160}
              value={fields.universityName}
              onChange={set("universityName")}
              onBlur={blur("universityName")}
              placeholder="e.g. University of Lahore"
              className={fieldError("universityName") ? INPUT_ERROR_CLS : INPUT_CLS}
              aria-invalid={Boolean(fieldError("universityName"))}
              aria-describedby={fieldError("universityName") ? "umnf-uni-error" : undefined}
            />
            {fieldError("universityName") && (
              <p id="umnf-uni-error" className="mt-1.5 text-xs text-red-600">{fieldError("universityName")}</p>
            )}
          </div>

          {/* Optional notes */}
          <div>
            <label htmlFor="umnf-msg" className="mb-1.5 block text-xs font-medium text-gray-700">
              Additional Details
              <span className="ml-1 font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              id="umnf-msg"
              rows={3}
              maxLength={500}
              value={fields.message}
              onChange={set("message")}
              onBlur={blur("message")}
              placeholder="e.g. city, HEC recognition status, website URL…"
              className={`resize-none ${fieldError("message") ? INPUT_ERROR_CLS : INPUT_CLS}`}
              aria-invalid={Boolean(fieldError("message"))}
              aria-describedby={fieldError("message") ? "umnf-msg-error" : undefined}
            />
            <div className="mt-1 flex items-start justify-between">
              {fieldError("message") ? (
                <p id="umnf-msg-error" className="text-xs text-red-600">{fieldError("message")}</p>
              ) : <span />}
              <span className="text-xs text-gray-400 tabular-nums">
                {fields.message.length}/500
              </span>
            </div>
          </div>

          {/* Server-level error banner */}
          {serverError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3" role="alert">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-xs text-red-700">{serverError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#c88410] py-2.5 text-sm font-semibold text-white hover:bg-[#a86e0d] active:bg-[#8f5e0b] disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[#c88410]/50"
            >
              {submitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Sending…
                </>
              ) : (
                "Send Request"
              )}
            </button>
          </div>
        </form>

        {/* ── Footer note ───────────────────────────────────────────────── */}
        <p className="px-6 pb-5 text-center text-xs text-gray-400">
          We'll send a confirmation to your email and follow up within 2–3 business days.
        </p>
      </div>
    </div>
  );
}
