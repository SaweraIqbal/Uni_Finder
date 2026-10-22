

export default function Skeleton({ className = "" }) {
  return <div className={`shimmer rounded ${className}`} />;
}

export function SkeletonRow({ cols = 4 }) {
  return (
    <div className="flex items-center gap-4 py-4 px-6 border-t border-gray-100">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === 0 ? "w-1/3" : "flex-1"}`} />
      ))}
    </div>
  );
}
