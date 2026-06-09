// Coloured status chip (pending / approved / rejected). Shared by the
// SuperAdmin dashboard and the University status page.
const STYLES = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-600 border-red-200",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border capitalize ${
        STYLES[status] || "bg-gray-100 text-gray-600 border-gray-200"
      }`}
    >
      {status}
    </span>
  );
}
