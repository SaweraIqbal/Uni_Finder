/**
 * DatePicker — custom calendar popover, fully self-contained.
 *
 * Props:
 *   value        string   "YYYY-MM-DD" (controlled)
 *   onChange     (isoString: string) => void
 *   label        string
 *   required     bool
 *   error        string
 *   helperText   string
 *   disablePast  bool     — greys out dates before today
 *   disabled     bool
 *   placeholder  string   default "DD / MM / YYYY"
 *   min          string   "YYYY-MM-DD"
 *   max          string   "YYYY-MM-DD"
 *   className    string
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

const DAYS   = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

function pad2(n) { return String(n).padStart(2, "0"); }

function toISO(y, m, d) { return `${y}-${pad2(m + 1)}-${pad2(d)}`; }

function parseISO(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m: m - 1, d };
}

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }

function firstDayOfMonth(y, m) { return new Date(y, m, 1).getDay(); }

export default function DatePicker({
  value,
  onChange,
  label,
  required = false,
  error,
  helperText,
  disablePast = false,
  disabled = false,
  placeholder = "DD / MM / YYYY",
  min,
  max,
  className = "",
}) {
  const today   = new Date();
  const todayY  = today.getFullYear();
  const todayM  = today.getMonth();
  const todayD  = today.getDate();

  const parsed  = parseISO(value);
  const initY   = parsed?.y ?? todayY;
  const initM   = parsed?.m ?? todayM;

  const [open,    setOpen]    = useState(false);
  const [viewY,   setViewY]   = useState(initY);
  const [viewM,   setViewM]   = useState(initM);
  const [inputTxt, setInputTxt] = useState(""); // raw typed text

  const wrapRef = useRef(null);

  // Sync input text when value prop changes
  useEffect(() => {
    if (value) {
      const p = parseISO(value);
      if (p) setInputTxt(`${pad2(p.d)} / ${pad2(p.m + 1)} / ${p.y}`);
    } else {
      setInputTxt("");
    }
  }, [value]);

  // Keep calendar view in sync when value changes externally
  useEffect(() => {
    if (parsed) { setViewY(parsed.y); setViewM(parsed.m); }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const isDisabledDate = useCallback((y, m, d) => {
    const iso = toISO(y, m, d);
    if (disablePast && iso < toISO(todayY, todayM, todayD)) return true;
    if (min && iso < min) return true;
    if (max && iso > max) return true;
    return false;
  }, [disablePast, min, max, todayY, todayM, todayD]);

  const selectDate = (y, m, d) => {
    if (isDisabledDate(y, m, d)) return;
    onChange?.(toISO(y, m, d));
    setOpen(false);
  };

  const prevMonth = () => {
    if (viewM === 0) { setViewY(y => y - 1); setViewM(11); }
    else setViewM(m => m - 1);
  };
  const nextMonth = () => {
    if (viewM === 11) { setViewY(y => y + 1); setViewM(0); }
    else setViewM(m => m + 1);
  };

  // Typed input auto-formatter: "ddmmyyyy" → "dd / mm / yyyy"
  const handleTyped = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, "").slice(0, 8);
    let out = raw;
    if (raw.length > 2) out = raw.slice(0, 2) + " / " + raw.slice(2);
    if (raw.length > 4) out = raw.slice(0, 2) + " / " + raw.slice(2, 4) + " / " + raw.slice(4);
    setInputTxt(out);

    if (raw.length === 8) {
      const d = parseInt(raw.slice(0, 2), 10);
      const m = parseInt(raw.slice(2, 4), 10) - 1;
      const y = parseInt(raw.slice(4, 8), 10);
      if (m >= 0 && m <= 11 && d >= 1 && d <= daysInMonth(y, m) && y >= 1900 && y <= 2100) {
        const iso = toISO(y, m, d);
        if (!isDisabledDate(y, m, d)) {
          onChange?.(iso);
          setViewY(y); setViewM(m);
        }
      }
    }
    if (raw.length === 0) onChange?.("");
  };

  // Build calendar grid
  const totalDays  = daysInMonth(viewY, viewM);
  const startDay   = firstDayOfMonth(viewY, viewM);
  const cells      = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const displayValue = inputTxt;
  const hasError     = Boolean(error);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}{required && <span className="text-orange-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Input row */}
      <div className={[
        "flex items-center w-full rounded-xl border bg-white transition-colors duration-150",
        "focus-within:ring-2 focus-within:ring-orange-300 focus-within:border-orange-400",
        hasError  ? "border-red-300 bg-red-50"   : "border-slate-200 hover:border-slate-300",
        disabled  ? "opacity-50 cursor-not-allowed bg-slate-50" : "",
      ].join(" ")}>
        <input
          type="text"
          value={displayValue}
          onChange={handleTyped}
          onFocus={() => !disabled && setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={false}
          className="flex-1 px-3 py-2.5 text-sm text-slate-800 bg-transparent outline-none
            placeholder:text-slate-400 min-w-0"
        />
        <button
          type="button"
          onClick={() => !disabled && setOpen(o => !o)}
          disabled={disabled}
          className="px-3 text-slate-400 hover:text-orange-500 transition-colors"
          tabIndex={-1}
        >
          <CalendarDays size={17} />
        </button>
      </div>

      {/* Validation messages */}
      {hasError && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          {error}
        </p>
      )}
      {helperText && !hasError && (
        <p className="mt-1 text-xs text-slate-400">{helperText}</p>
      )}

      {/* Calendar popover */}
      {open && !disabled && (
        <div className="absolute z-50 mt-1.5 left-0 bg-white border border-slate-200 rounded-2xl shadow-xl
          w-72 p-4 select-none"
          onMouseDown={(e) => e.preventDefault()} // prevent input blur
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 transition">
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-2">
              {/* Month selector */}
              <select value={viewM} onChange={(e) => setViewM(Number(e.target.value))}
                className="text-sm font-semibold text-slate-800 bg-transparent cursor-pointer
                  focus:outline-none appearance-none pr-1">
                {MONTHS.map((mo, i) => <option key={mo} value={i}>{mo}</option>)}
              </select>
              {/* Year selector */}
              <select value={viewY} onChange={(e) => setViewY(Number(e.target.value))}
                className="text-sm font-semibold text-slate-800 bg-transparent cursor-pointer
                  focus:outline-none appearance-none">
                {Array.from({ length: 100 }, (_, i) => todayY - 80 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button type="button" onClick={nextMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 transition">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs text-slate-400 font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Date grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((d, idx) => {
              if (!d) return <div key={idx} />;

              const iso       = toISO(viewY, viewM, d);
              const isToday   = viewY === todayY && viewM === todayM && d === todayD;
              const isSelected = value === iso;
              const isOff     = isDisabledDate(viewY, viewM, d);

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isOff}
                  onClick={() => selectDate(viewY, viewM, d)}
                  className={[
                    "mx-auto w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors",
                    isSelected
                      ? "bg-orange-500 text-white font-semibold"
                      : isToday
                        ? "border-2 border-orange-400 text-orange-600 font-semibold"
                        : isOff
                          ? "text-slate-300 cursor-not-allowed"
                          : "text-slate-700 hover:bg-orange-50 hover:text-orange-600 cursor-pointer",
                  ].join(" ")}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Today button */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-center">
            <button
              type="button"
              onClick={() => {
                if (!isDisabledDate(todayY, todayM, todayD)) {
                  selectDate(todayY, todayM, todayD);
                }
              }}
              className="text-xs font-medium text-orange-500 hover:text-orange-700 transition"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
