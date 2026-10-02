/**
 * CampusApprovalsSection.jsx
 * Campus module is deferred to a later phase.
 * This stub prevents routing crashes while communicating the state clearly.
 */
import { MapPin } from "lucide-react";
import { PageHeader } from "./ui";

export default function CampusApprovalsSection() {
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Campus Approvals"
        subtitle="Manage and approve campus registration requests."
      />
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center py-24 text-center px-6">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-5">
          <MapPin className="w-7 h-7 text-slate-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-700 mb-2">Campus Module Coming Soon</h2>
        <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
          The campus approval workflow is being built and will be available in the next release.
          Campus counts are currently sourced from HEC master data.
        </p>
      </div>
    </div>
  );
}
