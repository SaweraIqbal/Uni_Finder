
import { useEffect, useState } from "react";
import {
  RefreshCw,
  Building2,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";
import StatusPill from "../shared/StatusPill";

const API = "http://localhost:5000/api";

export default function CampusHostelVerifications() {
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const getToken = () => sessionStorage.getItem("token");

  const fetchHostels = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/campus-hostels/admin`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load hostels");
      }

      setHostels(
        Array.isArray(data) ? data : data.hostels || []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  const handleReview = async (id) => {
    setDetailsLoading(true);
    setError("");
    setSelectedHostel(null);
    setNotes("");

    try {
      const response = await fetch(
        `${API}/campus-hostels/${id}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load details");
      }

      setSelectedHostel(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewDocument = async (doc) => {
    // Open tab immediately to avoid popup blocking.
    const tab = window.open("", "_blank");

    try {
      const response = await fetch(
        `${API}/campus-hostel-documents/${doc.id}/view`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Document open failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (tab) {
        tab.location.href = url;
      } else {
        window.open(url, "_blank");
      }

      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      if (tab) tab.close();
      setError(err.message);
    }
  };

  const handleDecision = async (decision) => {
    if (!selectedHostel || submitting) return;

    const allowed =
      selectedHostel.university_approval === "approved" &&
      selectedHostel.super_admin_approval === "pending" &&
      selectedHostel.verification_status === "pending_super_admin";

    if (!allowed) {
      setError("University Admin approval required.");
      return;
    }

    if (decision === "rejected" && !notes.trim()) {
      setError("Please enter a rejection reason.");
      return;
    }

    const confirmed = window.confirm(
      decision === "approved"
        ? "Approve this campus hostel verification?"
        : "Reject this campus hostel verification?"
    );

    if (!confirmed) return;

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/campus-hostels/${selectedHostel.id}/super-admin-review`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            decision,
            notes: notes.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Review failed");
      }

      setMessage(data.message || "Review saved successfully");
      setSelectedHostel(null);
      setNotes("");
      await fetchHostels();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const canApprove =
    selectedHostel?.university_approval === "approved" &&
    selectedHostel?.super_admin_approval === "pending" &&
    selectedHostel?.verification_status === "pending_super_admin";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Campus Hostel Verifications
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review campus hostel verification requests.
          </p>
        </div>

        <button
          onClick={fetchHostels}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {message && (
        <div
          role="status"
          className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg"
        >
          <CheckCircle className="inline mr-2" size={18} />
          {message}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg"
        >
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading hostel requests...</p>
      ) : hostels.length === 0 ? (
        <div className="bg-white border rounded-xl p-10 text-center">
          <Building2
            size={36}
            className="mx-auto text-slate-400 mb-3"
          />
          No campus hostel requests found.
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4">Hostel</th>
                <th className="p-4">Gender</th>
                <th className="p-4">University Approval</th>
                <th className="p-4">Super Admin Approval</th>
                <th className="p-4">Status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {hostels.map((hostel) => (
                <tr key={hostel.id}>
                  <td className="p-4 font-medium">
                    {hostel.hostel_name}
                  </td>
                  <td className="p-4 capitalize">
                    {hostel.hostel_gender}
                  </td>
                  <td className="p-4">
                    <StatusPill status={hostel.university_approval} />
                  </td>
                  <td className="p-4">
                    <StatusPill status={hostel.super_admin_approval} />
                  </td>
                  <td className="p-4">
                    <StatusPill status={hostel.verification_status} />
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleReview(hostel.id)}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detailsLoading && (
        <p className="text-slate-500">Loading hostel details...</p>
      )}

      {selectedHostel && (
        <div className="bg-white border rounded-xl p-6 space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">
              Hostel Verification Review
            </h2>

            <button
              onClick={() => setSelectedHostel(null)}
              className="text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <p><strong>Hostel:</strong> {selectedHostel.hostel_name}</p>
            <p><strong>Gender:</strong> {selectedHostel.hostel_gender}</p>
            <p><strong>Address:</strong> {selectedHostel.hostel_address}</p>
            <p><strong>Phone:</strong> {selectedHostel.hostel_phone}</p>
            <p className="flex items-center gap-2"><strong>University Approval:</strong> <StatusPill status={selectedHostel.university_approval} /></p>
            <p className="flex items-center gap-2"><strong>Super Admin Approval:</strong> <StatusPill status={selectedHostel.super_admin_approval} /></p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">
              Verification Documents
            </h3>

            {selectedHostel.documents?.length ? (
              <div className="space-y-2">
                {selectedHostel.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-3 border rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={18} className="shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium capitalize">
                          {doc.document_type?.replaceAll("_", " ")}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {doc.original_name}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewDocument(doc)}
                      className="bg-orange-500 text-white px-3 py-2 rounded-lg text-xs shrink-0"
                    >
                      View Document
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">
                No documents found.
              </p>
            )}
          </div>

          {selectedHostel.university_review_notes && (
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="font-semibold text-sm">
                University Admin Notes
              </p>
              <p className="text-sm mt-1">
                {selectedHostel.university_review_notes}
              </p>
            </div>
          )}

          {!canApprove && (
            <div className="bg-amber-50 text-amber-800 border border-amber-200 rounded-lg p-4 text-sm">
              {selectedHostel.university_approval !== "approved"
                ? "University Admin approval required. Super Admin action is locked."
                : "This request is not pending final approval."}
            </div>
          )}

          <div className="border-t pt-5 space-y-4">
            <h3 className="font-semibold">
              Super Admin Decision
            </h3>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Review notes / rejection reason..."
              rows={3}
              disabled={!canApprove || submitting}
              className="w-full border rounded-lg p-3 text-sm disabled:bg-slate-100"
            />

            <div className="flex flex-wrap gap-3">
              <button
                disabled={!canApprove || submitting}
                onClick={() => handleDecision("approved")}
                className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCircle size={17} />
                {submitting ? "Processing..." : "Approve"}
              </button>

              <button
                disabled={!canApprove || submitting}
                onClick={() => handleDecision("rejected")}
                className="flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <XCircle size={17} />
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
