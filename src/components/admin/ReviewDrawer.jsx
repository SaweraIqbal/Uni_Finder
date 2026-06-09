// Slide-in panel showing one verification request's full details + documents,
// with Approve / Reject actions. Used by the SuperAdmin dashboard.
import StatusBadge from "../StatusBadge";
import { fileUrl } from "../../api/client";

export default function ReviewDrawer({ request, busy, onClose, onApprove, onReject }) {
  if (!request) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-end z-40">
      <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Verification Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <Field label="University Name" value={request.university_name} />
          <Field label="Registration No" value={request.registration_no} />
          <Field label="Contact" value={request.contact_no} />
          <Field label="Address" value={request.address} />
          <Field label="Admin" value={`${request.admin_name} (${request.admin_email})`} />

          <div>
            <p className="text-gray-400 mb-1">Status</p>
            <StatusBadge status={request.status} />
          </div>

          {request.reject_reason && (
            <div>
              <p className="text-gray-400 mb-1">Rejection Reason</p>
              <p className="text-red-600">{request.reject_reason}</p>
            </div>
          )}

          <div>
            <p className="text-gray-400 mb-2">Documents</p>
            <div className="grid grid-cols-2 gap-2">
              <DocBtn label="HEC Certificate" href={fileUrl(request.hec_certificate_url)} />
              <DocBtn label="Charter" href={fileUrl(request.charter_certificate_url)} />
              <DocBtn label="Accreditation" href={fileUrl(request.accreditation_document_url)} />
              <DocBtn label="Logo" href={fileUrl(request.university_logo_url)} />
            </div>
          </div>
        </div>

        {request.status === "pending" && (
          <div className="flex gap-3 mt-8">
            <button
              disabled={busy}
              onClick={() => onApprove(request.id)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium disabled:opacity-60"
            >
              Approve
            </button>
            <button
              disabled={busy}
              onClick={() => onReject(request)}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium disabled:opacity-60"
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-gray-400">{label}</p>
      <p className="text-gray-800 font-medium">{value || "—"}</p>
    </div>
  );
}

function DocBtn({ label, href }) {
  if (!href)
    return (
      <span className="text-xs text-gray-300 border border-dashed border-gray-200 rounded-lg py-2 text-center">
        {label}: none
      </span>
    );
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-xs text-[#c88410] border border-[#c88410]/30 hover:bg-[#c88410]/10 rounded-lg py-2 text-center font-medium"
    >
      {label}
    </a>
  );
}
