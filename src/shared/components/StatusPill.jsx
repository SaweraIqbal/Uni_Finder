import { Clock, CheckCircle2, XCircle, AlertTriangle, MinusCircle } from "lucide-react";

const STYLES = {
  pending:    { bg: "bg-amber-50",   text: "text-amber-700",   Icon: Clock,         label: "Pending" },
  approved:   { bg: "bg-emerald-50", text: "text-emerald-700", Icon: CheckCircle2,  label: "Approved" },
  rejected:   { bg: "bg-red-50",     text: "text-red-600",     Icon: XCircle,       label: "Rejected" },
  resubmission: { bg: "bg-orange-50", text: "text-orange-700", Icon: AlertTriangle, label: "Resubmission" },
  waiting:    { bg: "bg-slate-100",  text: "text-slate-500",   Icon: MinusCircle,   label: "Waiting" },
  neutral:    { bg: "bg-slate-100",  text: "text-slate-600",   Icon: Clock,         label: "" },
};

const pretty = (s = "") =>
  String(s)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

function resolveKey(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("reject")) return "rejected";
  if (s.includes("resubmi")) return "resubmission";
  if (s.includes("wait")) return "waiting";
  if (s.includes("pending")) return "pending";
  if (s.includes("approv")) return "approved";
  return "neutral";
}

export default function StatusPill({ status, label, className = "" }) {
  const key = resolveKey(status);
  const { bg, text, Icon, label: defaultLabel } = STYLES[key];
  const shown = label || (key === "neutral" ? pretty(status) || "—" : defaultLabel);

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium ${bg} ${text} ${className}`}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      {shown}
    </span>
  );
}

export function getApprovalStages(reg) {
  if (!reg) return { university: "pending", superAdmin: "waiting" };

  const status = String(reg.status || "pending").toLowerCase();
  const tier1 =
    reg.tier1?.approved === true || Number(reg.uni_tier1_approved) === 1;

  if (status === "approved") {
    return { university: "approved", superAdmin: "approved" };
  }

  if (status === "rejected") {

    const by = reg.rejection?.by || reg.rejected_by || (tier1 ? "super_admin" : "university");
    return by === "super_admin"
      ? { university: "approved", superAdmin: "rejected" }
      : { university: "rejected", superAdmin: "waiting" };
  }

  if (status === "resubmission_requested") {
    return { university: "resubmission", superAdmin: "waiting" };
  }

  return tier1
    ? { university: "approved", superAdmin: "pending" }
    : { university: "pending", superAdmin: "waiting" };
}
