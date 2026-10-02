import { useState } from "react";
import {
  Search,
  CheckCircle,
  Clock,
  X,
  AlertCircle,
  FileText,
} from "lucide-react";
import Modal from "./Modal.jsx";
import { useToast, ToastContainer } from "./Toast.jsx";

const HOSTELS = [
  {
    id: 1,
    name: "Al-Noor Boys Hostel",
    owner: "Mr. Tariq Mahmood",
    type: "Private",
    campus: null,
    tier1: null,
    tier1Date: null,
    status: "Pending Admin Approval",
    gender: "Boys",
    email: "alnoor.hostel@gmail.com",
    phone: "+92-300-1234567",
    city: "Lahore",
    address: "12-B, Johar Town, Lahore, Punjab",
    totalRooms: 24,
    capacity: 72,
    rent: "Rs. 15,000 – 25,000",
    facilities: ["WiFi", "Mess", "Laundry", "Security", "Hot Water"],
    submittedDate: "Sep 1, 2025",
    documents: [
      { name: "Owner_CNIC_Copy.pdf", size: "0.8 MB", date: "Sep 1, 2025" },
      { name: "Building_NOC.pdf", size: "1.4 MB", date: "Sep 1, 2025" },
    ],
    notes:
      "Private hostel near university belt. Walking distance from main campuses, verified safety cameras installed.",
    rejectionReason: null,
  },
  {
    id: 2,
    name: "Gulberg Girls Hostel",
    owner: "UCP Administration",
    type: "Campus",
    campus: "UCP Gulberg Campus",
    tier1: "Pending",
    tier1Date: null,
    status: "Awaiting Campus Approval",
    gender: "Girls",
    email: "hostel.gulberg@ucp.edu.pk",
    phone: "+92-42-35880011",
    city: "Lahore",
    address: "F-Block, Gulberg III, Lahore, Punjab",
    totalRooms: 18,
    capacity: 40,
    rent: "Rs. 18,000 – 30,000",
    facilities: ["WiFi", "Mess", "Warden", " CCTV", "Prayer Area"],
    submittedDate: "Aug 28, 2025",
    documents: [
      {
        name: "Hostel_Registration_UCP.pdf",
        size: "2.1 MB",
        date: "Aug 28, 2025",
      },
    ],
    notes:
      "Campus-affiliated girls hostel managed directly by UCP administration.",
    rejectionReason: null,
  },
  {
    id: 3,
    name: "FAST Boys Residence",
    owner: "FAST Administration",
    type: "Campus",
    campus: "FAST Chiniot-Faisalabad",
    tier1: "Approved",
    tier1Date: "Aug 25, 2025",
    status: "Pending Admin Approval",
    gender: "Boys",
    email: "residence@nu.edu.pk",
    phone: "+92-41-8765001",
    city: "Faisalabad",
    address: "Within FAST Chiniot-Faisalabad Campus, Faisalabad",
    totalRooms: 36,
    capacity: 108,
    rent: "Rs. 12,000 – 20,000",
    facilities: ["WiFi", "Mess", "Laundry", "Sports Area", "Medical Room"],
    submittedDate: "Aug 22, 2025",
    documents: [
      { name: "FAST_Hostel_Charter.pdf", size: "1.7 MB", date: "Aug 22, 2025" },
      {
        name: "Fire_Safety_Certificate.pdf",
        size: "0.9 MB",
        date: "Aug 22, 2025",
      },
    ],
    notes:
      "On-campus residence approved by FAST administration. Priority for first-year students.",
    rejectionReason: null,
  },
  {
    id: 4,
    name: "City View Apartments",
    owner: "Ms. Sadia Hussain",
    type: "Private",
    campus: null,
    tier1: null,
    tier1Date: null,
    status: "Live",
    gender: "Co-ed",
    email: "cityview.apartments@gmail.com",
    phone: "+92-321-9876543",
    city: "Islamabad",
    address: "G-11 Markaz, Islamabad, ICT",
    totalRooms: 30,
    capacity: 60,
    rent: "Rs. 25,000 – 45,000",
    facilities: ["WiFi", "Kitchen", "Parking", "Security", "Elevator"],
    submittedDate: "Jul 10, 2025",
    documents: [
      {
        name: "Apartment_Lease_Agreement.pdf",
        size: "2.6 MB",
        date: "Jul 10, 2025",
      },
    ],
    notes: "Premium private apartments, popular among graduate students.",
    rejectionReason: null,
  },
  {
    id: 5,
    name: "LUMS Annex Block",
    owner: "LUMS Administration",
    type: "Campus",
    campus: "LUMS Main Campus",
    tier1: "Approved",
    tier1Date: "Jul 30, 2025",
    status: "Live",
    gender: "Girls",
    email: "hostels@lums.edu.pk",
    phone: "+92-42-35608010",
    city: "Lahore",
    address: "LUMS Main Campus, D.H.A., Lahore Cantt, Punjab",
    totalRooms: 22,
    capacity: 66,
    rent: "Rs. 20,000 – 35,000",
    facilities: ["WiFi", "Mess", "Study Rooms", "Laundry", "24/7 Security"],
    submittedDate: "Jul 25, 2025",
    documents: [
      {
        name: "LUMS_Annex_Registration.pdf",
        size: "1.3 MB",
        date: "Jul 25, 2025",
      },
    ],
    notes: "Official LUMS annex residential block for female students.",
    rejectionReason: null,
  },
];

const STATUS_STYLES = {
  "Pending SA": "bg-amber-50 text-amber-700",
  "Awaiting Campus Approval": "bg-amber-50 text-amber-700",
  Live: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-red-50 text-red-600",
};

export default function HostelApprovals() {
  const [hostels, setHostels] = useState(HOSTELS);
  const [activeType, setActiveType] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const { toasts, showToast, removeToast } = useToast();

  const selectedHostel = hostels.find((h) => h.id === selectedId) ?? null;

  const filtered = hostels.filter((h) => {
    const typeMatch = activeType === "All" || h.type === activeType;
    const searchMatch =
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.owner.toLowerCase().includes(search.toLowerCase());
    return typeMatch && searchMatch;
  });

  const stats = [
    {
      label: "Pending Private",
      value: hostels.filter(
        (h) => h.type === "Private" && h.status === "Pending SA",
      ).length,
      color: "text-orange-500",
    },
    {
      label: "Pending Campus",
      value: hostels.filter(
        (h) => h.type === "Campus" && h.status === "Pending SA",
      ).length,
      color: "text-amber-500",
    },
    {
      label: "Live",
      value: hostels.filter((h) => h.status === "Live").length,
      color: "text-emerald-600",
    },
  ];

  const handleAction = (action) => {
    if (!selectedId) return;

    if (action === "reject") {
      setShowRejectModal(true);
      return;
    }

    setLoading(action);
    setTimeout(() => {
      setHostels((prev) =>
        prev.map((h) => (h.id === selectedId ? { ...h, status: "Live" } : h)),
      );
      setLoading(null);
      setSelectedId(null);
      showToast("success", "Hostel approved and is now live.");
    }, 800);
  };

  const handleRejectConfirm = () => {
    if (rejectionReason.trim().length < 10) {
      showToast(
        "error",
        "Please provide a rejection reason (min 10 characters).",
      );
      return;
    }

    setLoading("reject");
    setShowRejectModal(false);

    setTimeout(() => {
      setHostels((prev) =>
        prev.map((h) =>
          h.id === selectedId
            ? {
                ...h,
                status: "Rejected",
                rejectionReason: rejectionReason.trim(),
              }
            : h,
        ),
      );
      setLoading(null);
      setSelectedId(null);
      setRejectionReason("");
      showToast("error", "Hostel listing rejected.");
    }, 800);
  };

  const handleRejectCancel = () => {
    setShowRejectModal(false);
    setRejectionReason("");
  };

  return (
    <div className="space-y-5">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
          Hostel Approvals
        </h1>
        <p className="text-gray-500 text-[15px] mt-1">
          Manage private and campus-affiliated hostel listings and approvals
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl shadow-sm p-6 hover:-translate-y-0.5 transition-transform"
          >
            <p className="text-gray-500 text-sm">{s.label}</p>
            <p className={`text-4xl font-bold mt-2 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-2">
          {["All", "Private", "Campus"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1 ${
                activeType === t
                  ? "bg-orange-500 text-white"
                  : "bg-white border border-gray-200 text-slate-700 hover:border-orange-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by hostel name..."
            className="bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors w-full sm:w-60"
            aria-label="Search hostels"
          />
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((h) => {
          const isCampus = h.type === "Campus";
          const tier1Done = h.tier1 === "Approved";
          const canReview = !isCampus || tier1Done;
          const isLive = h.status === "Live";
          return (
            <div key={h.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {h.name}
                  </p>
                  <p className="text-xs text-gray-400">{h.owner}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${h.type === "Private" ? "bg-slate-100 text-slate-600" : "bg-orange-50 text-orange-600"}`}
                  >
                    {h.type}
                  </span>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[h.status] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {h.status}
                  </span>
                </div>
              </div>
              {h.campus && (
                <p className="text-xs text-gray-500 mt-2">Campus: {h.campus}</p>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                {isCampus ? (
                  <div className="flex items-center gap-1.5">
                    {tier1Done ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                        <CheckCircle size={11} /> T1 Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                        <Clock size={11} /> T1 Pending
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">Private listing</span>
                )}
                {isLive ? (
                  <span className="text-xs font-medium text-gray-400">
                    Live
                  </span>
                ) : (
                  <button
                    disabled={!canReview}
                    onClick={() => setSelectedId(h.id)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                      canReview
                        ? "bg-orange-500 text-white hover:bg-orange-600"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                    }`}
                  >
                    Review
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {[
                "Hostel",
                "Type",
                "Affiliated Campus",
                "Campus Admin Approval",
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
            {filtered.map((h, i) => {
              const isCampus = h.type === "Campus";
              const tier1Done = h.tier1 === "Approved";
              const canReview = !isCampus || tier1Done;
              const isLive = h.status === "Live";
              return (
                <tr
                  key={h.id}
                  className={`hover:bg-gray-50 transition-colors ${i < filtered.length - 1 ? "border-b border-gray-100" : ""}`}
                >
                  <td className="px-6 py-5">
                    <p className="text-slate-800 font-medium text-sm">
                      {h.name}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">{h.owner}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${h.type === "Private" ? "bg-slate-100 text-slate-600" : "bg-orange-50 text-orange-600"}`}
                    >
                      {h.type}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-slate-600 text-sm">
                    {h.campus ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-5">
                    {!isCampus ? (
                      <span className="text-gray-300">—</span>
                    ) : tier1Done ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                        <CheckCircle size={12} /> Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                        <Clock size={12} /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[h.status] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {h.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    {isLive ? (
                      <span className="text-xs font-medium text-gray-400">
                        Live
                      </span>
                    ) : (
                      <button
                        disabled={!canReview}
                        onClick={() => setSelectedId(h.id)}
                        className={`text-xs font-semibold px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                          canReview
                            ? "bg-orange-500 text-white hover:bg-orange-600"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                        }`}
                      >
                        Review
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      <Modal
        open={selectedId !== null}
        onClose={() => {
          if (!loading) setSelectedId(null);
        }}
        maxWidth="max-w-xl"
      >
        {selectedHostel && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-slate-800 font-bold text-lg leading-tight">
                  {selectedHostel.name}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {selectedHostel.gender} hostel · {selectedHostel.city}
                </p>
              </div>
              <button
                onClick={() => {
                  if (!loading) setSelectedId(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors shrink-0 ml-4"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tier-1 pending banner (campus hostels only) */}
            {selectedHostel.type === "Campus" &&
              selectedHostel.tier1 !== "Approved" && (
                <div className="mx-6 mt-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <AlertCircle size={17} className="text-amber-600 shrink-0" />
                  <p className="text-amber-800 text-sm font-medium">
                    Awaiting approval from Campus Admin — Super Admin action
                    locked
                  </p>
                </div>
              )}

            <div className="p-6 space-y-4">
              {/* Identity grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                    Owner / Managed By
                  </p>
                  <p className="text-slate-800 font-semibold text-sm mt-1">
                    {selectedHostel.owner}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {selectedHostel.phone}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                    Contact Email
                  </p>
                  <p className="text-slate-800 font-semibold text-sm mt-1 truncate">
                    {selectedHostel.email}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                    Hostel Type
                  </p>
                  <p className="text-slate-800 font-semibold text-sm mt-1">
                    {selectedHostel.type} · {selectedHostel.gender}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                    Affiliated Campus
                  </p>
                  <p className="text-slate-800 font-semibold text-sm mt-1">
                    {selectedHostel.campus ?? "Independent listing"}
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Rooms", value: selectedHostel.totalRooms },
                  {
                    label: "Capacity",
                    value: `${selectedHostel.capacity} beds`,
                  },
                  { label: "Rent / Month", value: selectedHostel.rent },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-gray-50 rounded-xl p-4 text-center"
                  >
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                      {s.label}
                    </p>
                    <p className="text-slate-800 font-bold text-base mt-1">
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Facilities */}
              {selectedHostel.facilities?.length > 0 && (
                <div>
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-2">
                    Facilities
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedHostel.facilities.map((f) => (
                      <span
                        key={f}
                        className="text-xs font-medium bg-gray-50 text-slate-600 border border-gray-100 px-3 py-1.5 rounded-full"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tier-1 card (campus hostels only) */}
              {selectedHostel.type === "Campus" && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-2">
                    Campus Admin Approval
                  </p>
                  {selectedHostel.tier1 === "Approved" ? (
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                        <CheckCircle size={15} /> Approved
                      </span>
                      <span className="text-gray-400 text-xs">
                        {selectedHostel.tier1Date}
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700">
                      <Clock size={15} /> Pending review
                    </span>
                  )}
                </div>
              )}

              {/* Address */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
                  Full Address
                </p>
                <p className="text-slate-700 text-sm">
                  {selectedHostel.address}
                </p>
              </div>

              {/* Documents */}
              {selectedHostel.documents?.length > 0 && (
                <div>
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-2">
                    Attached Documents
                  </p>
                  <div className="space-y-2">
                    {selectedHostel.documents.map((d) => (
                      <div
                        key={d.name}
                        className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3"
                      >
                        <FileText size={16} className="text-red-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-700 text-sm font-medium truncate">
                            {d.name}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {d.size} · {d.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedHostel.notes && (
                <div>
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-2">
                    Supporting Notes
                  </p>
                  <p className="text-slate-700 text-sm bg-gray-50 rounded-xl p-4 leading-relaxed">
                    {selectedHostel.notes}
                  </p>
                </div>
              )}

              {/* Rejection reason (if rejected) */}
              {selectedHostel.status === "Rejected" &&
                selectedHostel.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-500 text-xs font-semibold uppercase tracking-wide mb-1">
                      Rejection Reason
                    </p>
                    <p className="text-red-800 text-sm">
                      {selectedHostel.rejectionReason}
                    </p>
                  </div>
                )}
            </div>

            {/* Actions — same gate logic */}
            <div className="px-6 pb-6">
              {selectedHostel.status === "Pending Admin Approval" ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction("approve")}
                    disabled={loading !== null}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    {loading === "approve" && (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    Approve & Publish
                  </button>
                  <button
                    onClick={() => handleAction("reject")}
                    disabled={loading !== null}
                    className="flex-1 flex items-center justify-center gap-2 border-2 border-red-500 text-red-500 hover:bg-red-50 disabled:opacity-60 font-semibold py-2.5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    {loading === "reject" && (
                      <span className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                    )}
                    Reject
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedId(null)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  Close
                </button>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* Rejection Reason Modal */}
      <Modal
        open={showRejectModal}
        onClose={handleRejectCancel}
        maxWidth="max-w-md"
      >
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <h2 className="text-slate-800 font-bold text-lg">
            Reject Hostel Listing
          </h2>
          <button
            onClick={handleRejectCancel}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Please provide a reason for rejecting this hostel listing. This will
            help the owner understand what needs to be corrected.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter the reason for rejection..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">
              Minimum 10 characters required
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleRejectCancel}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-slate-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleRejectConfirm}
              disabled={rejectionReason.trim().length < 10 || loading !== null}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
