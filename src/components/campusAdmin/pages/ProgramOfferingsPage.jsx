/**
 * Page 3 — Program Offerings List  (fully wired to real API)
 * Page 4 — Program Offering Detail (shown when a row is selected)
 *
 * Flow:
 *   1. Campus admin clicks "+ Add Program Offering"
 *   2. AddProgramModal opens — shows all university approved programs
 *      with already-added ones greyed out, multi-select checkboxes
 *   3. On confirm → campus_programs rows created (status: draft)
 *   4. Admin clicks "Continue Setup" / pencil → ProgramDetailPage
 *   5. Admin fills in 8 sections and saves → can Publish
 */
import { useCallback, useEffect, useState } from "react";
import {
  Pencil, MoreHorizontal, Plus, Search,
  AlertTriangle, ChevronLeft, ChevronRight, RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  Card, PrimaryBtn, SecondaryBtn, StatusPill, SectionTitle,
  FilterChip, IconBtn, ProgressBar,
} from "../ui";
import { useCampusAdmin } from "../CampusAdminContext";
import {
  listCampusPrograms,
  deleteCampusProgram,
  publishCampusProgram,
  unpublishCampusProgram,
} from "../../../api/campus";
import ProgramDetailPage from "./ProgramDetailPage";
import AddProgramModal   from "./AddProgramModal";

const LEVELS = ["All", "Undergraduate", "MS", "MPhil", "PhD", "ADP", "Diploma"];

/** Map a campus_programs JOIN row → display shape */
function shapeRow(r) {
  const status =
    r.status === "published" ? "success" :
    r.status === "draft"     ? "draft"   : "pending";
  const statusLabel =
    r.status === "published" ? "Published" :
    r.status === "draft"     ? "Draft"     : "Incomplete";

  // completeness: published = 100; otherwise based on fee + shifts being filled
  const completeness =
    r.status === "published" ? 100 :
    (r.fee ? 50 : 10) + (r.shifts ? 30 : 0);

  // Build display name: "BS Computer Science" (degree_type already part of name after seeding)
  const displayName = r.name || "—";

  return {
    id:          r.id,
    program_id:  r.program_id,
    name:        displayName,
    degree:      r.degree_type || "—",
    level:       r.level       || "—",
    shifts:      r.shifts      || "—",
    fee:         r.fee         ? `Rs. ${r.fee}` : "—",
    completeness,
    status,
    statusLabel,
    _raw: r,
  };
}

function CompletenessCell({ value, status }) {
  const color =
    status === "success" ? "text-green-700 font-semibold" :
    status === "pending" ? "text-amber-700 font-semibold" :
    "text-gray-500 font-semibold";
  return (
    <div className="flex items-center gap-2">
      <ProgressBar value={value} className="w-16" />
      <span className={`text-xs ${color}`}>{value}%</span>
    </div>
  );
}

export default function ProgramOfferingsPage() {
  const { campus, addToast } = useCampusAdmin();
  const campusId      = campus?.id;
  const universityId  = campus?.university_id;

  const [rows,        setRows]        = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [levelFilter, setLevelFilter] = useState("All");
  const [search,      setSearch]      = useState("");
  const [openMenu,    setOpenMenu]    = useState(null);
  const [selected,    setSelected]    = useState(null);   // → ProgramDetailPage
  const [showModal,   setShowModal]   = useState(false);  // → AddProgramModal
  const [page,        setPage]        = useState(1);
  const PAGE_SIZE = 10;

  const load = useCallback(async () => {
    if (!campusId) return;
    setLoading(true);
    try {
      const data = await listCampusPrograms(campusId);
      setRows(Array.isArray(data) ? data.map(shapeRow) : []);
    } catch {
      toast.error("Could not load programs.");
    } finally {
      setLoading(false);
    }
  }, [campusId]);

  useEffect(() => { load(); }, [load]);

  // IDs already added — passed to modal so it can grey them out
  const addedProgramIds = rows.map((r) => r.program_id);

  const handleDelete = async (row) => {
    if (!window.confirm(`Remove "${row.name}" from this campus?`)) return;
    try {
      await deleteCampusProgram(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      addToast(`"${row.name}" removed.`);
    } catch {
      toast.error("Could not remove program.");
    }
  };

  const handlePublish = async (row) => {
    try {
      await publishCampusProgram(row.id);
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? { ...r, status: "success", statusLabel: "Published", completeness: 100 }
            : r
        )
      );
      addToast(`"${row.name}" published.`);
    } catch {
      toast.error("Could not publish.");
    }
    setOpenMenu(null);
  };

  const handleUnpublish = async (row) => {
    try {
      await unpublishCampusProgram(row.id);
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? { ...r, status: "draft", statusLabel: "Draft" }
            : r
        )
      );
      addToast(`"${row.name}" unpublished.`, "info");
    } catch {
      toast.error("Could not unpublish.");
    }
    setOpenMenu(null);
  };

  // Open ProgramDetailPage for a row
  if (selected) {
    return (
      <ProgramDetailPage
        program={selected._raw ?? selected}
        onBack={() => { setSelected(null); load(); }}
      />
    );
  }

  const filtered = rows.filter((r) => {
    const matchLevel  = levelFilter === "All" || r.level === levelFilter;
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    return matchLevel && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className="space-y-4">

        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search programs…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <FilterChip
                key={l} label={l}
                active={levelFilter === l}
                onClick={() => { setLevelFilter(l); setPage(1); }}
              />
            ))}
          </div>

          {/* Add Program button — opens modal */}
          <PrimaryBtn
            className="ml-auto"
            onClick={() => setShowModal(true)}
          >
            <Plus className="w-4 h-4" />
            Add Program Offering
          </PrimaryBtn>

          <button
            type="button" onClick={load} disabled={loading}
            className="p-2 rounded-lg hover:bg-gray-100 text-slate-400 disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* ── Table ── */}
        <Card className="p-0 overflow-hidden">
          {loading && rows.length === 0 ? (
            <div className="px-6 py-10 space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-10 bg-gray-50 rounded animate-pulse" />
              ))}
            </div>
          ) : paged.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
                <Plus className="w-5 h-5 text-orange-400" />
              </div>
              <p className="text-sm">
                {rows.length === 0
                  ? "No programs added yet. Click \"Add Program Offering\" to get started."
                  : "No programs match your filter."}
              </p>
              {rows.length === 0 && (
                <PrimaryBtn onClick={() => setShowModal(true)}>
                  <Plus className="w-4 h-4" /> Add Program Offering
                </PrimaryBtn>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    {["Program Name", "Degree", "Level", "Shifts", "Fee / Semester", "Completeness", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold uppercase tracking-wide text-slate-400 px-4 py-3 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-100 hover:bg-gray-50 transition-colors"
                      style={{ height: 56 }}
                    >
                      <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{row.name}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{row.degree}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{row.level}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{row.shifts}</td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{row.fee}</td>
                      <td className="px-4 py-3">
                        <CompletenessCell value={row.completeness} status={row.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <StatusPill variant={row.status} label={row.statusLabel} />
                          {row.status === "pending" && (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {row.status === "draft" ? (
                            <PrimaryBtn size="sm" onClick={() => setSelected(row)}>
                              Fill Details
                            </PrimaryBtn>
                          ) : (
                            <>
                              <IconBtn title="Edit details" onClick={() => setSelected(row)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </IconBtn>
                              <div className="relative">
                                <IconBtn
                                  title="More actions"
                                  onClick={() => setOpenMenu(openMenu === row.id ? null : row.id)}
                                >
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </IconBtn>
                                {openMenu === row.id && (
                                  <>
                                    <div className="fixed inset-0 z-20" onClick={() => setOpenMenu(null)} />
                                    <div className="absolute right-0 top-full mt-1 z-30 bg-white rounded-xl shadow-xl border border-slate-100 py-1 w-40">
                                      {row.status === "success" ? (
                                        <button
                                          type="button"
                                          onClick={() => handleUnpublish(row)}
                                          className="w-full text-left text-sm text-slate-700 px-4 py-2 hover:bg-gray-50 transition-colors"
                                        >
                                          Unpublish
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handlePublish(row)}
                                          className="w-full text-left text-sm text-slate-700 px-4 py-2 hover:bg-gray-50 transition-colors"
                                        >
                                          Publish
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => { handleDelete(row); setOpenMenu(null); }}
                                        className="w-full text-left text-sm text-red-600 px-4 py-2 hover:bg-red-50 transition-colors"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {rows.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                Page {page} of {totalPages} · {filtered.length} offering{filtered.length !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-1">
                <IconBtn disabled={page <= 1} title="Previous page" onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </IconBtn>
                <span className="text-xs text-slate-600 px-2">{page}</span>
                <IconBtn disabled={page >= totalPages} title="Next page" onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="w-3.5 h-3.5" />
                </IconBtn>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── Add Program Modal ── */}
      {showModal && (
        <AddProgramModal
          campusId={campusId}
          universityId={universityId}
          alreadyAddedIds={addedProgramIds}
          onClose={() => setShowModal(false)}
          onAdded={() => { setShowModal(false); load(); }}
        />
      )}
    </>
  );
}

export function ProgramOfferingsActions() {
  return null; // header button replaced by inline toolbar button
}
