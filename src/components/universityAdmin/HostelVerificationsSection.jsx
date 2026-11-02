import { useEffect, useState } from "react";
import { RefreshCw, Building2 } from "lucide-react";
import StatusPill from "../shared/StatusPill";

const API_BASE = "http://localhost:5000/api";

export default function HostelVerificationsSection() {
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const authHeaders = () => ({
    Authorization: `Bearer ${sessionStorage.getItem("token")}`,
  });

  const fetchHostels = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/campus-hostels/university`, {
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch hostels");
      setHostels(Array.isArray(data) ? data : data.hostels || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  const handleReview = async (hostelId) => {
    setReviewLoading(true);
    setReviewError("");
    setSelectedHostel(null);
    setReviewNotes("");
    try {
      const response = await fetch(`${API_BASE}/campus-hostels/${hostelId}`, {
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load hostel details");
      setSelectedHostel(data);
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleViewDocument = async (doc) => {
    // Open a blank tab synchronously so the browser does not block it after fetch.
    const tab = window.open("", "_blank");
    if (!tab) {
      alert("Browser ne new tab block kar diya. Pop-ups allow karke dobara try karo.");
      return;
    }
    tab.opener = null;
    try {
      const response = await fetch(
        `${API_BASE}/campus-hostel-documents/${doc.id}/view`,
        { headers: authHeaders() }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Document open nahi ho saka");
      }
      const blob = await response.blob();
      const fileUrl = URL.createObjectURL(blob);
      tab.location.href = fileUrl;
      setTimeout(() => URL.revokeObjectURL(fileUrl), 60000);
    } catch (err) {
      tab.close();
      alert(err.message);
    }
  };

  const handleDecision = async (decision) => {
    if (!selectedHostel || submitting || selectedHostel.university_approval !== "pending") return;
    if (decision === "rejected" && !reviewNotes.trim()) {
      alert("Reject karne ki reason likho.");
      return;
    }
    const confirmed = window.confirm(
      decision === "approved"
        ? "Kya aap hostel approve karke Super Admin ko forward karna chahte hain?"
        : "Kya aap hostel verification reject karna chahte hain?"
    );
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `${API_BASE}/campus-hostels/${selectedHostel.id}/university-review`,
        {
          method: "PATCH",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ decision, notes: reviewNotes.trim() }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Review failed");
      alert(data.message);
      setSelectedHostel(null);
      setReviewNotes("");
      await fetchHostels();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Hostel Verifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            Review campus hostel verification requests submitted under your university.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchHostels}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading hostel requests...</p>
      ) : error ? (
        <div className="rounded-xl bg-red-50 p-4 text-red-700">{error}</div>
      ) : hostels.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center">
          <Building2 className="mx-auto mb-3 text-slate-400" size={36} />
          <p className="font-medium text-slate-700">No hostel verification requests found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Hostel Name</th>
                <th className="px-4 py-3">Gender</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">University Approval</th>
                <th className="px-4 py-3">Super Admin Approval</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {hostels.map((hostel) => (
                <tr key={hostel.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{hostel.hostel_name}</td>
                  <td className="px-4 py-3 capitalize">{hostel.hostel_gender}</td>
                  <td className="px-4 py-3">{hostel.hostel_address}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={hostel.university_approval} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={hostel.super_admin_approval} />
                  </td>
                  <td className="px-4 py-3">
                    {hostel.created_at
                      ? new Date(hostel.created_at).toLocaleDateString("en-PK")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleReview(hostel.id)}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
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

      {reviewLoading && <p className="text-sm text-slate-500">Loading hostel details...</p>}
      {reviewError && (
        <div className="rounded-xl bg-red-50 p-4 text-red-700">{reviewError}</div>
      )}

      {selectedHostel && (
        <div className="bg-white border rounded-xl p-6 space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">Hostel Verification Review</h2>
            <button
              type="button"
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
            <p><strong>Latitude:</strong> {selectedHostel.latitude}</p>
            <p><strong>Longitude:</strong> {selectedHostel.longitude}</p>
            <p className="flex items-center gap-2"><strong>University Status:</strong> <StatusPill status={selectedHostel.university_approval} /></p>
            <p className="flex items-center gap-2"><strong>Super Admin Status:</strong> <StatusPill status={selectedHostel.super_admin_approval} /></p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-800 mb-3">Verification Documents</h3>
            {selectedHostel.documents?.length ? (
              <div className="space-y-2">
                {selectedHostel.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-wrap justify-between items-center gap-3 border rounded-lg p-3"
                  >
                    <div>
                      <p className="font-medium capitalize">{doc.document_type}</p>
                      <p className="text-xs text-slate-500">{doc.original_name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusPill status={doc.verification_status} />
                      <button
                        type="button"
                        onClick={() => handleViewDocument(doc)}
                        className="px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600"
                      >
                        View Document
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No documents found.</p>
            )}
          </div>

          {selectedHostel.university_approval === "pending" && (
            <div className="border-t pt-5 space-y-4">
              <h3 className="font-semibold text-slate-800">University Admin Decision</h3>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Review notes / rejection reason..."
                rows={3}
                className="w-full border border-slate-300 rounded-lg p-3 text-sm"
              />
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleDecision("approved")}
                  className="px-5 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Approve & Forward"}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleDecision("rejected")}
                  className="px-5 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
