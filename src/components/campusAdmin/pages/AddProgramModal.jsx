/**
 * AddProgramModal
 * Shows all approved programs for the campus's university.
 * Campus admin picks one (or many) and clicks "Add Selected".
 * Already-added programs are greyed out and unselectable.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Check, BookOpen } from "lucide-react";
import { toast } from "react-toastify";
import { listUniversityApprovedPrograms, addCampusProgram } from "../../../api/campus";

const LEVEL_ORDER = ["Undergraduate", "MS", "MPhil", "PhD", "ADP", "Diploma"];

function levelBadgeClass(level) {
  switch (level) {
    case "Undergraduate": return "bg-blue-50 text-blue-600";
    case "MS":
    case "MPhil":         return "bg-purple-50 text-purple-600";
    case "PhD":           return "bg-rose-50 text-rose-600";
    case "ADP":
    case "Diploma":       return "bg-teal-50 text-teal-600";
    default:              return "bg-slate-100 text-slate-500";
  }
}

export default function AddProgramModal({ campusId, universityId, alreadyAddedIds = [], onClose, onAdded }) {
  const [allPrograms, setAllPrograms] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [levelFilter, setLevelFilter] = useState("All");
  const [selected,    setSelected]    = useState(new Set());
  const [saving,      setSaving]      = useState(false);
  const searchRef = useRef(null);

  // Focus search on open
  useEffect(() => { searchRef.current?.focus(); }, []);

  // Load university programs once
  useEffect(() => {
    if (!universityId) { setLoading(false); return; }
    listUniversityApprovedPrograms(universityId)
      .then((data) => setAllPrograms(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Could not load programs."))
      .finally(() => setLoading(false));
  }, [universityId]);

  const alreadySet = useMemo(() => new Set(alreadyAddedIds), [alreadyAddedIds]);

  // Available levels for filter chips
  const availableLevels = useMemo(() => {
    const levels = [...new Set(allPrograms.map((p) => p.level).filter(Boolean))];
    return ["All", ...LEVEL_ORDER.filter((l) => levels.includes(l))];
  }, [allPrograms]);

  // Filtered + sorted list
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allPrograms
      .filter((p) => {
        const matchLevel = levelFilter === "All" || p.level === levelFilter;
        const displayName = `${p.degree_type ? p.degree_type + " " : ""}${p.name}`.toLowerCase();
        const matchSearch = !q || displayName.includes(q);
        return matchLevel && matchSearch;
      })
      .sort((a, b) => {
        // sort by level order first, then name
        const la = LEVEL_ORDER.indexOf(a.level);
        const lb = LEVEL_ORDER.indexOf(b.level);
        if (la !== lb) return la - lb;
        return a.name.localeCompare(b.name);
      });
  }, [allPrograms, search, levelFilter]);

  const toggle = (id) => {
    if (alreadySet.has(id)) return; // can't select already-added
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    let added = 0;
    let failed = 0;
    for (const programId of selected) {
      const { ok, data } = await addCampusProgram({ campus_id: campusId, program_id: programId });
      if (ok) added++;
      else {
        // 409 = already added (race condition) — treat as soft success
        if (data?.message?.includes("already")) added++;
        else failed++;
      }
    }
    setSaving(false);
    if (added > 0) {
      toast.success(`${added} program${added > 1 ? "s" : ""} added. Fill in details to publish.`);
      onAdded();
    }
    if (failed > 0) toast.error(`${failed} program${failed > 1 ? "s" : ""} could not be added.`);
    if (added > 0) onClose();
  };

  const newCount    = selected.size;
  const totalShown  = filtered.length;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-slate-900/50" onClick={onClose} />

      {/* Modal panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: "90vh" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Add Program Offerings</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Select from your university's approved programs. You can add details after.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-slate-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Search + level filter ── */}
          <div className="px-6 py-3 border-b border-gray-100 space-y-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search programs…"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-500"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableLevels.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLevelFilter(l)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    levelFilter === l
                      ? "bg-orange-500 text-white"
                      : "bg-white border border-gray-200 text-slate-600 hover:bg-gray-50"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* ── Program list ── */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="px-6 py-8 space-y-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="h-12 bg-gray-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                <BookOpen className="w-8 h-8" />
                <p className="text-sm">
                  {allPrograms.length === 0
                    ? "No approved programs found for this university."
                    : "No programs match your search."}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {filtered.map((p) => {
                  const alreadyAdded = alreadySet.has(p.id);
                  const isSelected   = selected.has(p.id);
                  const displayName  = p.degree_type ? `${p.degree_type} ${p.name}` : p.name;

                  return (
                    <li
                      key={p.id}
                      onClick={() => toggle(p.id)}
                      className={`flex items-center gap-4 px-6 py-3.5 transition-colors ${
                        alreadyAdded
                          ? "opacity-40 cursor-not-allowed"
                          : "cursor-pointer hover:bg-orange-50/60"
                      } ${isSelected ? "bg-orange-50" : ""}`}
                    >
                      {/* Checkbox */}
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                          alreadyAdded
                            ? "border-slate-200 bg-slate-100"
                            : isSelected
                            ? "border-orange-500 bg-orange-500"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {(isSelected || alreadyAdded) && (
                          <Check className={`w-3 h-3 ${alreadyAdded ? "text-slate-400" : "text-white"}`} />
                        )}
                      </div>

                      {/* Name */}
                      <span className={`flex-1 text-sm font-medium ${isSelected ? "text-orange-700" : "text-slate-800"}`}>
                        {displayName}
                        {alreadyAdded && (
                          <span className="ml-2 text-xs font-normal text-slate-400">(already added)</span>
                        )}
                      </span>

                      {/* Level badge */}
                      {p.level && (
                        <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${levelBadgeClass(p.level)}`}>
                          {p.level}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-4 shrink-0 bg-white">
            <p className="text-xs text-slate-400">
              {totalShown} program{totalShown !== 1 ? "s" : ""} shown
              {newCount > 0 && (
                <span className="ml-2 text-orange-600 font-semibold">
                  · {newCount} selected
                </span>
              )}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-slate-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={newCount === 0 || saving}
                onClick={handleAdd}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Adding…
                  </>
                ) : (
                  `Add ${newCount > 0 ? newCount : ""} Program${newCount !== 1 ? "s" : ""}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
