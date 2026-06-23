import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import StatusBadge from "../StatusBadge";
import RejectModal from "../admin/RejectModal";
import {
  listCampusRequestsForOwner,
  approveCampus,
  rejectCampus,
} from "../../api/campus";

export default function CampusRequestsTab({ ownerUid }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listCampusRequestsForOwner(ownerUid);
      setRequests(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

  }, [ownerUid]);

  const approve = async (id) => {
    setBusy(true);
    try {
      const { ok, data } = await approveCampus(id);
      if (ok) {
        toast.success("Approved. Email sent to the campus admin.");
        load();
      } else {
        toast.error(data.message || "Approve failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const doReject = async () => {
    if (!reason.trim()) {
      toast.error("Please enter a reason");
      return;
    }
    setBusy(true);
    try {
      const { ok, data } = await rejectCampus(rejecting.id, reason.trim());
      if (ok) {
        toast.success("Rejected. Reason emailed to the campus admin.");
        setRejecting(null);
        setReason("");
        load();
      } else {
        toast.error(data.message || "Reject failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-4xl">
      <div className="p-5 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-800">Campus Requests</h2>
        <p className="text-sm text-gray-500">
          Campus admins requesting to register a campus under your university.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400">Loading…</div>
      ) : requests.length === 0 ? (
        <div className="p-8 text-center text-gray-400">No campus requests yet.</div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-5 py-3 font-medium">Campus</th>
              <th className="px-5 py-3 font-medium">Admin</th>
              <th className="px-5 py-3 font-medium">City</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-t border-gray-100">
                <td className="px-5 py-3 font-medium text-gray-800">{r.campus_name}</td>
                <td className="px-5 py-3 text-gray-600">
                  {r.admin_name}
                  <div className="text-xs text-gray-400">{r.admin_email}</div>
                </td>
                <td className="px-5 py-3 text-gray-600">{r.city || "—"}</td>
                <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-5 py-3 text-right">
                  {r.status === "pending" ? (
                    <div className="flex gap-2 justify-end">
                      <button
                        disabled={busy}
                        onClick={() => approve(r.id)}
                        className="text-green-600 font-medium hover:underline disabled:opacity-60"
                      >
                        Approve
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => setRejecting(r)}
                        className="text-red-500 font-medium hover:underline disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <RejectModal
        request={rejecting}
        reason={reason}
        setReason={setReason}
        busy={busy}
        onCancel={() => {
          setRejecting(null);
          setReason("");
        }}
        onConfirm={doReject}
      />
    </div>
  );
}
