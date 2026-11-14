/**
 * StatusChip — small inline status badge.
 * variant: 'complete' | 'incomplete' | 'expired' | 'missing' | 'awaited' | 'uploaded'
 */
export default function StatusChip({ variant = "incomplete", label }) {
  const styles = {
    complete:   "bg-green-50  text-green-700  border-green-200",
    incomplete: "bg-amber-50  text-amber-700  border-amber-200",
    expired:    "bg-amber-50  text-amber-700  border-amber-200",
    missing:    "bg-amber-50  text-amber-700  border-amber-200",
    awaited:    "bg-blue-50   text-blue-700   border-blue-200",
    uploaded:   "bg-green-50  text-green-700  border-green-200",
    error:      "bg-red-50    text-red-700    border-red-200",
  };

  const dots = {
    complete:   "bg-green-500",
    incomplete: "bg-amber-500",
    expired:    "bg-amber-500",
    missing:    "bg-amber-500",
    awaited:    "bg-blue-500",
    uploaded:   "bg-green-500",
    error:      "bg-red-500",
  };

  const defaultLabels = {
    complete:   "Complete",
    incomplete: "Incomplete",
    expired:    "Expired",
    missing:    "Missing",
    awaited:    "Result Awaited",
    uploaded:   "Uploaded",
    error:      "Error",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant] ?? styles.incomplete}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dots[variant] ?? dots.incomplete}`} />
      {label ?? defaultLabels[variant] ?? variant}
    </span>
  );
}
