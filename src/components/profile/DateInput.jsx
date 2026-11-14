/**
 * DateInput — a styled date picker that looks like professional form inputs.
 * Uses <input type="date"> under the hood but with a custom overlay so the
 * native picker still works while the display is clean.
 *
 * Props: same as a standard <input> + { label, error, required, helperText }
 */
export default function DateInput({
  label,
  error,
  required = false,
  helperText,
  value,
  onChange,
  min,
  max,
  placeholder = "DD / MM / YYYY",
  disabled = false,
  className = "",
  ...rest
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-orange-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Calendar icon */}
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </span>

        <input
          type="date"
          value={value || ""}
          onChange={onChange}
          min={min}
          max={max}
          disabled={disabled}
          {...rest}
          className={[
            "w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm text-slate-800",
            "focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400",
            "transition-colors duration-150",
            // Make the native date picker placeholder text lighter
            "text-slate-800 [&:not(:has(input:placeholder-shown))]:text-slate-800",
            error
              ? "border-red-300 bg-red-50"
              : "border-slate-200 bg-white hover:border-slate-300",
            disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : "cursor-pointer",
            // Chrome: style the picker icon to match our brand
            "[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer",
          ].filter(Boolean).join(" ")}
        />
      </div>

      {helperText && !error && (
        <p className="text-xs text-slate-400">{helperText}</p>
      )}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
