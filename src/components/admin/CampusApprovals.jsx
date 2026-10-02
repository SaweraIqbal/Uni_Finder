import { useState } from "react";
import { CheckCircle, Clock, X, AlertCircle, FileText } from "lucide-react";
import Modal from "./Modal.jsx";
import { useToast, ToastContainer } from "./Toast.jsx";

const INITIAL_CAMPUSES = [
  {
    id: 1,
    name: "UCP Gulberg Campus",
    email: "gulberg@ucp.edu.pk",
    university: "UCP",
    parentUniName: "University of Central Punjab",
    city: "Lahore",
    province: "Punjab",
    address: "23-A, Main Boulevard Gulberg, Lahore 54660, Punjab",
    type: "City Campus",
    established: 2023,
    contactPerson: "Dr. Ayesha Khan",
    phone: "+92-42-35750001",
    programs: 18,
    students: 2450,
    hostels: 1,
    tier1: "Pending",
    tier1Date: null,
    status: "Pending",
    submittedDate: "Aug 24, 2025",
    notes:
      "Additional campus proposed to expand access to business and computing programs in central Lahore.",
    documents: [
      {
        name: "UCP_Gulberg_Registration.pdf",
        size: "2.1 MB",
        date: "Aug 24, 2025",
      },
      {
        name: "Campus_Facilities_Plan.pdf",
        size: "1.6 MB",
        date: "Aug 24, 2025",
      },
    ],
    rejectionReason: null,
  },
  {
    id: 2,
    name: "FAST Chiniot-Faisalabad Campus",
    email: "chiniot@nu.edu.pk",
    university: "FAST",
    parentUniName: "FAST National University",
    city: "Faisalabad",
    province: "Punjab",
    address: "Jaranwala Road, Chiniot-Faisalabad Campus, Faisalabad, Punjab",
    type: "Main Campus",
    established: 2022,
    contactPerson: "Dr. Kamran Ahmed",
    phone: "+92-41-8757001",
    programs: 12,
    students: 1680,
    hostels: 2,
    tier1: "Pending",
    tier1Date: null,
    status: "Pending",
    submittedDate: "Aug 29, 2025",
    notes:
      "The campus will support technology programs and regional industry partnerships in Faisalabad.",
    documents: [
      {
        name: "FAST_Campus_Proposal.pdf",
        size: "3.2 MB",
        date: "Aug 29, 2025",
      },
      {
        name: "Faculty_Availability.pdf",
        size: "980 KB",
        date: "Aug 29, 2025",
      },
    ],
    rejectionReason: null,
  },
  {
    id: 3,
    name: "COMSATS Attock Campus",
    email: "attock@comsats.edu.pk",
    university: "COMSATS",
    parentUniName: "COMSATS University Islamabad",
    city: "Attock",
    province: "Punjab",
    address: "Kamra Road, Attock City, Attock 43600, Punjab",
    type: "City Campus",
    established: 2021,
    contactPerson: "Dr. Sajjad Haider",
    phone: "+92-57-9317001",
    programs: 15,
    students: 2130,
    hostels: 2,
    tier1: "Approved",
    tier1Date: "Aug 20, 2025",
    status: "Pending",
    submittedDate: "Aug 16, 2025",
    notes:
      "All academic facilities, laboratories, and faculty requirements have been verified by the university administration.",
    documents: [
      { name: "CUI_Attock_Charter.pdf", size: "2.8 MB", date: "Aug 16, 2025" },
      {
        name: "Infrastructure_Assessment.pdf",
        size: "1.4 MB",
        date: "Aug 16, 2025",
      },
    ],
    rejectionReason: null,
  },
  {
    id: 4,
    name: "LUMS DHA Campus",
    email: "dha@lums.edu.pk",
    university: "LUMS",
    parentUniName: "Lahore University of Management Sciences",
    city: "Lahore",
    province: "Punjab",
    address: "DHA Phase 5, Lahore Cantt, Lahore 54792, Punjab",
    type: "Main",
    established: 2020,
    contactPerson: "Dr. Sobia Hamid",
    phone: "+92-42-35608001",
    programs: 29,
    students: 5800,
    hostels: 5,
    tier1: "Approved",
    tier1Date: "Jul 22, 2025",
    status: "Approved",
    submittedDate: "Jul 15, 2025",
    notes:
      "Campus registration and supporting institutional documentation are complete.",
    documents: [
      {
        name: "LUMS_DHA_Registration.pdf",
        size: "2.4 MB",
        date: "Jul 15, 2025",
      },
    ],
    rejectionReason: null,
  },
  {
    id: 5,
    name: "Bahria Karachi Campus",
    email: "karachi@bahria.edu.pk",
    university: "Bahria",
    parentUniName: "Bahria University",
    city: "Karachi",
    province: "Sindh",
    address: "National Stadium Road, Karachi 75290, Sindh",
    type: "City Campus",
    established: 2019,
    contactPerson: "Dr. Arshad Malik",
    phone: "+92-21-99240002",
    programs: 22,
    students: 3150,
    hostels: 3,
    tier1: "Approved",
    tier1Date: "Jun 18, 2025",
    status: "Rejected",
    submittedDate: "Jun 10, 2025",
    notes:
      "Application submitted with a facilities expansion plan for the Karachi campus.",
    documents: [
      {
        name: "Bahria_Karachi_Proposal.pdf",
        size: "2.7 MB",
        date: "Jun 10, 2025",
      },
      {
        name: "Hostel_Compliance_Report.pdf",
        size: "860 KB",
        date: "Jun 10, 2025",
      },
    ],
    rejectionReason:
      "The submitted facilities plan does not demonstrate sufficient laboratory capacity for the proposed student intake.",
  },
];

const STATUS_STYLES = {
  Pending: "bg-amber-50 text-amber-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-red-50 text-red-600",
};
const TABS = ["Pending", "Approved", "Rejected"];

export default function CampusApprovals() {
  const [campuses, setCampuses] = useState(INITIAL_CAMPUSES);
  const [activeTab, setActiveTab] = useState("All");
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const { toasts, showToast, removeToast } = useToast();
  const selectedCampus = campuses.find((c) => c.id === selectedId) ?? null;
  const filtered =
    activeTab === "All"
      ? campuses
      : campuses.filter((c) => c.status === activeTab);
  const tabCount = (tab) =>
    tab === "All"
      ? campuses.length
      : campuses.filter((c) => c.status === tab).length;
  const pendingCount = campuses.filter((c) => c.status === "Pending").length;
  const approvedCount = campuses.filter((c) => c.status === "Approved").length;

  const closeReview = () => {
    if (loading === null) setSelectedId(null);
  };
  const handleAction = (action) => {
    if (!selectedId) return;
    if (action === "reject") {
      setShowRejectModal(true);
      return;
    }
    setLoading(action);
    setTimeout(() => {
      setCampuses((prev) =>
        prev.map((c) =>
          c.id === selectedId ? { ...c, status: "Approved" } : c,
        ),
      );
      setLoading(null);
      setSelectedId(null);
      showToast("success", "Campus approved successfully.");
    }, 800);
  };
  const handleRejectCancel = () => {
    if (loading !== null) return;
    setShowRejectModal(false);
    setRejectionReason("");
  };
  const handleRejectConfirm = () => {
    if (rejectionReason.trim().length < 10) return;
    setLoading("reject");
    setShowRejectModal(false);
    setTimeout(() => {
      setCampuses((prev) =>
        prev.map((c) =>
          c.id === selectedId
            ? { ...c, status: "Rejected", rejectionReason }
            : c,
        ),
      );
      setLoading(null);
      setSelectedId(null);
      setRejectionReason("");
      showToast("error", "Campus application rejected.");
    }, 800);
  };

  return (
    <div className="space-y-5">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
          Campus Approvals
        </h1>
        <p className="text-gray-500 text-[15px] mt-1">
          Two-tier approval workflow for new campus registrations
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Pending Approval",
            value: pendingCount,
            color: "text-orange-500",
          },
          {
            label: "Approved",
            value: approvedCount,
            color: "text-emerald-600",
          },
          {
            label: "Total Campuses",
            value: campuses.length,
            color: "text-slate-800",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl shadow-sm p-6 hover:-translate-y-0.5 transition-transform"
          >
            <p className="text-gray-500 text-sm">{s.label}</p>
            <p className={`text-4xl font-bold mt-2 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {["All", ...TABS].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1 ${activeTab === t ? "bg-orange-500 text-white" : "bg-white border border-gray-200 text-slate-700 hover:border-orange-300"}`}
          >
            {t}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${activeTab === t ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}
            >
              {tabCount(t)}
            </span>
          </button>
        ))}
      </div>
      <div className="md:hidden space-y-3">
        {filtered.map((c) => (
          <CampusCard
            key={c.id}
            campus={c}
            onReview={() => setSelectedId(c.id)}
          />
        ))}
      </div>
      <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {[
                "Campus",
                "University",
                "City",
                "Tier-1 (Univ. Admin)",
                "Status",
                "Action",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider px-6 py-4"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <CampusRow
                key={c.id}
                campus={c}
                bordered={i < filtered.length - 1}
                onReview={() => setSelectedId(c.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
      <Modal
        open={selectedId !== null}
        onClose={closeReview}
        maxWidth="max-w-xl"
      >
        {selectedCampus && (
          <ReviewModal
            campus={selectedCampus}
            loading={loading}
            onClose={closeReview}
            onAction={handleAction}
          />
        )}
      </Modal>
      <Modal
        open={showRejectModal}
        onClose={handleRejectCancel}
        maxWidth="max-w-lg"
      >
        <RejectModal
          loading={loading}
          reason={rejectionReason}
          onChange={setRejectionReason}
          onCancel={handleRejectCancel}
          onConfirm={handleRejectConfirm}
        />
      </Modal>
    </div>
  );
}

function CampusCard({ campus, onReview }) {
  const tier1Done = campus.tier1 === "Approved";
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {campus.name}
          </p>
          <p className="text-xs text-gray-400">{campus.email}</p>
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLES[campus.status]}`}
        >
          {campus.status}
        </span>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {campus.university} · {campus.city}
          </span>
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${tier1Done ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
          >
            {tier1Done ? <CheckCircle size={10} /> : <Clock size={10} />} T1
          </span>
        </div>
        <button
          onClick={onReview}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          Review
        </button>
      </div>
    </div>
  );
}

function CampusRow({ campus, bordered, onReview }) {
  const tier1Done = campus.tier1 === "Approved";
  return (
    <tr
      className={`hover:bg-gray-50 transition-colors ${bordered ? "border-b border-gray-100" : ""}`}
    >
      <td className="px-6 py-5">
        <p className="text-slate-800 font-medium text-sm">{campus.name}</p>
        <p className="text-gray-400 text-xs mt-0.5">{campus.email}</p>
      </td>
      <td className="px-6 py-5 text-slate-600 text-sm">{campus.university}</td>
      <td className="px-6 py-5 text-slate-600 text-sm">{campus.city}</td>
      <td className="px-6 py-5">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${tier1Done ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
        >
          {tier1Done ? <CheckCircle size={12} /> : <Clock size={12} />}
          {tier1Done ? " Approved" : " Pending"}
        </span>
      </td>
      <td className="px-6 py-5">
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[campus.status]}`}
        >
          {campus.status}
        </span>
      </td>
      <td className="px-6 py-5">
        <button
          onClick={onReview}
          className="text-xs font-semibold px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          Review
        </button>
      </td>
    </tr>
  );
}

function ReviewModal({ campus, loading, onClose, onAction }) {
  const canAct = campus.tier1 === "Approved" && campus.status === "Pending";
  return (
    <>
      <div className="flex items-start justify-between p-6 border-b border-gray-100">
        <div>
          <h2 className="text-slate-800 font-bold text-lg leading-tight">
            {campus.name}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {campus.city}, {campus.province} · {campus.parentUniName}
          </p>
        </div>
        <button
          onClick={onClose}
          disabled={loading !== null}
          className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors shrink-0 ml-4"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>
      {campus.tier1 === "Pending" && (
        <div className="mx-6 mt-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertCircle size={17} className="text-amber-600 shrink-0" />
          <p className="text-amber-800 text-sm font-medium">
            Awaiting approval from University Admin — Super Admin action locked
          </p>
        </div>
      )}
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <InfoBox
            label="Parent University"
            value={campus.parentUniName}
            subvalue={campus.university}
          />
          <InfoBox label="Campus Email" value={campus.email} />
          <InfoBox
            label="Campus Type"
            value={campus.type}
            subvalue={`Est. ${campus.established}`}
          />
          <InfoBox
            label="Contact Person"
            value={campus.contactPerson}
            subvalue={campus.phone}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Programs", value: campus.programs },
            { label: "Students", value: campus.students.toLocaleString() },
            { label: "Hostels", value: campus.hostels },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-gray-50 rounded-xl p-4 text-center"
            >
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                {stat.label}
              </p>
              <p className="text-slate-800 font-semibold text-lg mt-1">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-2">
            Tier-1 (University Admin)
          </p>
          {campus.tier1 === "Approved" ? (
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                <CheckCircle size={15} /> Approved
              </span>
              <span className="text-gray-400 text-xs">{campus.tier1Date}</span>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700">
              <Clock size={15} /> Pending review
            </span>
          )}
        </div>
        <DetailBox label="Full Address" value={campus.address} />
        <div>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-2">
            Attached Documents
          </p>
          <div className="space-y-3">
            {campus.documents.map((document) => (
              <div
                key={document.name}
                className="flex items-center gap-4 bg-gray-50 rounded-xl p-4"
              >
                <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 text-sm font-medium truncate">
                    {document.name}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {document.size} · {document.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <DetailBox label="Supporting Notes" value={campus.notes} />
        {campus.status === "Rejected" && campus.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700 text-xs font-medium uppercase tracking-wide mb-1">
              Rejection Reason
            </p>
            <p className="text-red-800 text-sm leading-relaxed">
              {campus.rejectionReason}
            </p>
          </div>
        )}
      </div>
      <div className="px-6 pb-6">
        {canAct ? (
          <div className="flex gap-3">
            <button
              onClick={() => onAction("approve")}
              disabled={loading !== null}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {loading === "approve" && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              Approve Campus
            </button>
            <button
              onClick={() => onAction("reject")}
              disabled={loading !== null}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-red-500 text-red-500 hover:bg-red-50 disabled:opacity-60 font-semibold py-2.5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Reject
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            disabled={loading !== null}
            className="w-full bg-gray-100 hover:bg-gray-200 disabled:opacity-60 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            Close
          </button>
        )}
      </div>
    </>
  );
}

function InfoBox({ label, value, subvalue }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">
        {label}
      </p>
      <p className="text-slate-800 font-semibold text-sm mt-1 break-words">
        {value}
      </p>
      {subvalue && <p className="text-gray-400 text-xs">{subvalue}</p>}
    </div>
  );
}
function DetailBox({ label, value }) {
  return (
    <div>
      <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-2">
        {label}
      </p>
      <p className="text-slate-700 text-sm bg-gray-50 rounded-xl p-4 leading-relaxed">
        {value}
      </p>
    </div>
  );
}
function RejectModal({ loading, reason, onChange, onCancel, onConfirm }) {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <h2 className="text-slate-800 font-bold text-lg">
          Reject Campus Application
        </h2>
        <button
          onClick={onCancel}
          disabled={loading !== null}
          className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>
      <p className="text-sm text-slate-600">
        Please provide a reason for rejecting this campus application. This will
        help the university understand what needs to be corrected.
      </p>
      <div>
        <label
          htmlFor="rejection-reason"
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          Rejection Reason <span className="text-red-500">*</span>
        </label>
        <textarea
          id="rejection-reason"
          value={reason}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter the reason for rejection..."
          rows={5}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-sm"
        />
        <p className="text-xs text-slate-400 mt-1">
          Minimum 10 characters required
        </p>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          disabled={loading !== null}
          className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-slate-700 font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-60 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading !== null || reason.trim().length < 10}
          className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          Confirm Rejection
        </button>
      </div>
    </div>
  );
}
