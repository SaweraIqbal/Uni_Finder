import { ShieldCheck } from "lucide-react";

export default function HostelApprovalsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center">
        <ShieldCheck className="w-7 h-7 text-orange-400" />
      </div>
      <h2 className="text-xl font-semibold text-slate-700">Hostel Approvals — Coming Soon</h2>
      <p className="text-sm text-slate-400 max-w-xs">
        Hostel approval management will be available in a future update.
      </p>
    </div>
  );
}
