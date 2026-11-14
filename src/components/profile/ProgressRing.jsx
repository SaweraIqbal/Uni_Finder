/**
 * ProgressRing — SVG ring for the readiness card.
 * percentage: 0–100, size: px (default 72), strokeWidth: px (default 6)
 */
export default function ProgressRing({ percentage = 0, size = 72, strokeWidth = 6, label }) {
  const pct    = Math.min(Math.max(Math.round(percentage), 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;

  const color =
    pct >= 80 ? "#22c55e" :   // green-500
    pct >= 50 ? "#f97316" :   // orange-500
    "#f59e0b";                // amber-400

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          cx={size / 2} cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      {/* Percentage text — rotated back upright by wrapping in absolute position */}
      <span className="text-xs font-bold text-slate-700 -mt-1">{pct}%</span>
      {label && <span className="text-xs text-slate-500 text-center leading-tight">{label}</span>}
    </div>
  );
}
