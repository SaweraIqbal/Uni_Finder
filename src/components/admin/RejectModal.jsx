// Modal that collects a rejection reason before rejecting a request.
// The reason is emailed to the university admin.
export default function RejectModal({ request, reason, setReason, busy, onCancel, onConfirm }) {
  if (!request) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-1">Reject Verification</h3>
        <p className="text-sm text-gray-500 mb-4">
          The reason below will be emailed to{" "}
          <span className="font-medium">{request.admin_email}</span>.
        </p>

        <textarea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. The HEC certificate is unclear / expired. Please re-upload a valid copy."
          className="w-full border-2 border-gray-200 focus:border-[#c88410] outline-none rounded-xl p-3 text-sm"
        />

        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-200 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            disabled={busy}
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-medium disabled:opacity-60"
          >
            Send Rejection
          </button>
        </div>
      </div>
    </div>
  );
}
