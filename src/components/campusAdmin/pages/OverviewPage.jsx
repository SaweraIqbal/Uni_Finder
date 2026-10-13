/**
 * Page 1 — Dashboard Overview
 * Real API: getCampusOverviewStats + getCampusActivity
 */
import { useCallback, useEffect, useState } from "react";
import { Award, BookOpen, BedDouble, Clock, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";
import { Card, PrimaryBtn, SecondaryBtn, ProgressBar, SectionTitle } from "../ui";
import { useCampusAdmin } from "../CampusAdminContext";
import { getCampusOverviewStats, getCampusActivity } from "../../../api/campus";

const fmtAgo = (iso) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

function KpiCard({ icon: Icon, label, value, valueColor }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-orange-500" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">{label}</p>
        {value === null
          ? <div className="h-8 w-12 bg-gray-100 rounded animate-pulse" />
          : <p className={`text-2xl font-bold ${valueColor || "text-slate-900"}`}>{value}</p>}
      </div>
    </div>
  );
}

function ChecklistItem({ label, status, onClick }) {
  const done = status === "done";
  return (
    <div className={`flex items-center gap-2 text-sm ${!done && onClick ? "cursor-pointer group" : ""}`}
      onClick={!done && onClick ? onClick : undefined}>
      {done
        ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
        : <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
      <span className={`flex-1 ${done ? "text-slate-700" : "text-amber-700 group-hover:underline"}`}>{label}</span>
    </div>
  );
}

export default function OverviewPage() {
  const { navigateTo, campus, programs } = useCampusAdmin();
  const campusId = campus?.id;

  const [stats,    setStats]    = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading,  setLoading]  = useState(false);

  const loadData = useCallback(async () => {
    if (!campusId) return;
    setLoading(true);
    try {
      const [s, a] = await Promise.all([
        getCampusOverviewStats(campusId),
        getCampusActivity(campusId, 5),
      ]);
      setStats(s);
      setActivity(Array.isArray(a) ? a : []);
    } catch { /* non-fatal — keep defaults */ }
    setLoading(false);
  }, [campusId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Completeness from server or fallback
  const sections  = stats?.completeness?.sections || {};
  const doneSects  = stats?.completeness?.done  ?? (programs.length > 0 ? 4 : 3);
  const totalSects = stats?.completeness?.total ?? 9;
  const completeness = Math.round((doneSects / totalSects) * 100);

  const CHECKLIST = [
    { label: "Profile",              status: sections.profile              ? "done" : "warn", page: "campus-profile" },
    { label: "Contact",              status: sections.contact              ? "done" : "warn", page: "campus-profile" },
    { label: "Description",          status: sections.description          ? "done" : "warn", page: "campus-profile" },
    { label: "Admissions Calendar",  status: sections.admissions_calendar  ? "done" : "warn", page: "campus-profile" },
    { label: "Facilities",           status: sections.facilities           ? "done" : "warn", page: "facilities" },
    { label: "Gallery",              status: sections.gallery              ? "done" : "warn", page: "gallery" },
    { label: "Societies",            status: sections.societies            ? "done" : "warn", page: "societies" },
    { label: "Hostels",              status: sections.hostels              ? "done" : "warn", page: "hostels" },
    { label: "Programs",             status: sections.programs             ? "done" : "warn", page: "program-offerings" },
  ];

  const activityItems = activity.map((a) => ({
    text: a.description || a.action,
    time: fmtAgo(a.created_at),
  }));

  return (
    <div className="space-y-6">
      {/* Completeness */}
      <Card>
        <div className="flex items-center justify-between mb-1">
          <SectionTitle title="Campus Profile Completeness" />
          <button type="button" onClick={loadData} disabled={loading}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-slate-400 disabled:opacity-40">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <ProgressBar value={completeness} className="flex-1" />
          <span className="text-sm text-slate-600 shrink-0 font-medium">
            {doneSects} of {totalSects} sections complete
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {CHECKLIST.map((item) => (
            <ChecklistItem key={item.label} label={item.label} status={item.status}
              onClick={item.page ? () => navigateTo(item.page) : undefined} />
          ))}
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={BookOpen} label="Program Offerings" value={stats ? stats.programs_count : null} />
        <KpiCard icon={Award}    label="Gallery Images"    value={stats ? stats.images_count   : null} />
        <KpiCard icon={BedDouble} label="Linked Hostels"  value={stats ? stats.linked_hostels  : null} />
        <KpiCard icon={Clock}    label="Societies"         value={stats ? stats.societies_count : null} valueColor="text-amber-500" />
      </div>

      {/* Activity */}
      <Card>
        <SectionTitle title="Recent Activity" />
        {activityItems.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No recent activity.</p>
        ) : (
          <div className="space-y-3">
            {activityItems.map((a, i) => (
              <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-700 flex-1">{a.text}</span>
                <span className="text-xs text-slate-400 shrink-0 tabular-nums">{a.time}</span>
              </div>
            ))}
          </div>
        )}
        <button type="button" onClick={() => navigateTo("activity")}
          className="mt-3 text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
          View Full Activity Log <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </Card>
    </div>
  );
}

export function OverviewActions() {
  const { navigateTo } = useCampusAdmin();
  return <SecondaryBtn onClick={() => navigateTo("campus-profile")}>Edit Campus Profile</SecondaryBtn>;
}
