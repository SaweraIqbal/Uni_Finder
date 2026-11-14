/**
 * ProgressBar — horizontal completion bar.
 * percentage: 0–100
 */
export default function ProgressBar({ percentage = 0, showLabel = true, className = "" }) {
  const pct = Math.min(Math.max(Math.round(percentage), 0), 100);

  const color =
    pct >= 80 ? "bg-green-500" :
    pct >= 50 ? "bg-orange-500" :
    "bg-amber-400";

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-slate-500 font-medium">Profile completion</span>
          <span className="text-xs font-semibold text-slate-700">{pct}%</span>
        </div>
      )}
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
