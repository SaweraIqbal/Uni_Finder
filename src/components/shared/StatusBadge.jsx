import StatusPill from "./StatusPill";

// Kept for backwards compatibility — all badges now share the StatusPill design.
export default function StatusBadge({ status }) {
  return <StatusPill status={status} />;
}
