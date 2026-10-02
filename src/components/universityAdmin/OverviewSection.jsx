import { BookOpen, ChevronRight, Clock, Mail, MapPin, Zap } from "lucide-react";
import { useUniversityAdmin } from "./UniversityAdminContext";
import { EmptyState, PageHeader, StatCard, StatusChip, formatDate, formatShortDate } from "./ui";

// Action label + colour mapping for real activity_log.action values
const actionConfig = {
  profile_updated:             { dot: "bg-blue-500",   label: "Profile Updated" },
  active_students_updated:     { dot: "bg-blue-500",   label: "Students Updated" },
  logo_uploaded:               { dot: "bg-green-500",  label: "Logo Uploaded" },
  banner_uploaded:             { dot: "bg-green-500",  label: "Banner Uploaded" },
  programs_synced:             { dot: "bg-green-500",  label: "Programs Synced" },
  verification_submitted:      { dot: "bg-amber-500",  label: "Verification Submitted" },
  verification_status_changed: { dot: "bg-amber-500",  label: "Verification Updated" },
};

function ActivityRow({ entry, onClick }) {
  const cfg = actionConfig[entry.action] || { dot: "bg-slate-400", label: entry.action };
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-3 px-5 py-3.5 w-full text-left hover:bg-orange-50/50 transition-colors group"
    >
      <span className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0 mt-1.5`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 leading-relaxed line-clamp-2">
          {entry.description}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-slate-400 tabular-nums">
            {formatShortDate(entry.created_at)}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
            {cfg.label}
          </span>
        </div>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0 mt-1" />
    </button>
  );
}

export default function OverviewSection() {
  const {
    university,
    stats,
    activityLog,
    loadingMe,
    loadingStats,
    loadingActivity,
    navigateTo,
    universityName,
    openSideSheet,
  } = useUniversityAdmin();

  const uni          = university || {};
  const verification = uni.verification || {};

  // Domain card state — FIX 2: uses stored domain_state, not recomputed
  const domainVerified = verification.domain_verified === true;
  const appStatus      = verification.status ? verification.status.toLowerCase() : null;

  // LOE card — FIX 5: real file existence check
  const loeOnFile = Boolean(verification.loe_on_file);

  // Pending programs from real stats
  const pendingPrograms = stats?.pending_programs ?? 0;

  // Recent activity (last 5)
  const recentActivity = Array.isArray(activityLog) ? activityLog.slice(0, 5) : [];

  function openActivityDetail(entry) {
    openSideSheet({
      title: `Activity Detail`,
      body: (
        <div className="space-y-4 text-sm">
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
            {[
              ["Timestamp", formatDate(entry.created_at)],
              ["Actor",     entry.actor_name],
              ["Action",    actionConfig[entry.action]?.label || entry.action],
              ["Description", entry.description],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <span className="text-xs text-slate-400 shrink-0">{k}</span>
                <span className="text-xs text-slate-800 font-medium text-right">{v}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    });
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Dashboard Overview"
        subtitle={universityName ? `${universityName} · Admin Dashboard` : "Admin Dashboard"}
      />

      {/* ── Status cards row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">

        {/* Domain verification */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-orange-50">
              <Mail className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Domain Verification
            </p>
          </div>
          {loadingMe ? (
            <div className="h-6 w-24 rounded bg-slate-100 animate-pulse" />
          ) : (
            <StatusChip
              status={domainVerified ? "verified" : "pending"}
              label={domainVerified ? "Verified" : "Unverified"}
            />
          )}
          {!loadingMe && !domainVerified && (
            <button
              type="button"
              onClick={() => navigateTo("profile")}
              className="mt-3 text-xs text-orange-600 hover:text-orange-700 font-medium"
            >
              View on Profile →
            </button>
          )}
        </div>

        {/* Authorization letter */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-orange-50">
              <BookOpen className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Auth Letter
            </p>
          </div>
          {loadingMe ? (
            <div className="h-6 w-24 rounded bg-slate-100 animate-pulse" />
          ) : (
            <StatusChip
              status={loeOnFile ? "verified" : appStatus === "approved" ? "verified" : "pending"}
              label={loeOnFile || appStatus === "approved" ? "On File" : "Not Provided"}
            />
          )}
        </div>

        {/* Pending programs (only show when > 0) */}
        {!loadingStats && pendingPrograms > 0 && (
          <StatCard
            label="Pending Programs"
            value={pendingPrograms}
            sub="Awaiting approval"
            icon={<BookOpen className="w-4 h-4" />}
            onClick={() => navigateTo("programs")}
          />
        )}

        {/* Campus approvals — deferred */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 opacity-60">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-slate-100">
              <MapPin className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Campus Approvals
            </p>
          </div>
          <p className="text-xs text-slate-400 italic">Campus module coming soon</p>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Campuses",
            value: loadingMe ? null : (uni.campus_count ?? "—"),
            icon: <MapPin className="w-4 h-4" />,
          },
          {
            label: "Programs",
            value: loadingStats ? null : (stats?.program_count ?? "—"),
            icon: <BookOpen className="w-4 h-4" />,
          },
          {
            label: "Active Students",
            value: loadingMe ? null : Number(uni.active_students ?? 0).toLocaleString(),
            icon: <MapPin className="w-4 h-4" />,
          },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
              {label}
            </p>
            {value === null ? (
              <div className="h-8 w-16 rounded bg-slate-100 animate-pulse mt-1" />
            ) : (
              <p className="text-2xl font-bold text-slate-800">{value}</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Recent Activity ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
          <Zap className="w-4 h-4 text-orange-500" />
          <h2 className="text-sm font-semibold text-slate-800">Recent Activity</h2>
        </div>

        {loadingActivity ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-slate-200 animate-pulse" />
                <div className="h-4 rounded bg-slate-100 animate-pulse flex-1" />
              </div>
            ))}
          </div>
        ) : recentActivity.length === 0 ? (
          <EmptyState
            message="No activity yet. Actions like saving your profile, uploading a logo, or syncing programs will appear here."
            icon="📋"
          />
        ) : (
          <div className="divide-y divide-slate-50">
            {recentActivity.map((entry) => (
              <ActivityRow
                key={entry.id}
                entry={entry}
                onClick={() => openActivityDetail(entry)}
              />
            ))}
          </div>
        )}

        <div className="px-5 py-3 border-t border-slate-50">
          <button
            type="button"
            onClick={() => navigateTo("activity")}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
          >
            View Full Activity Log →
          </button>
        </div>
      </div>

      {/* ── Pending Actions (programs only — campus deferred) ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-slate-800">Pending Actions</h2>
        </div>
        {!loadingStats && pendingPrograms === 0 ? (
          <EmptyState message="No pending actions. All clear!" icon="✅" />
        ) : loadingStats ? (
          <div className="p-5">
            <div className="h-4 w-48 rounded bg-slate-100 animate-pulse" />
          </div>
        ) : (
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800">
                {pendingPrograms} program{pendingPrograms !== 1 ? "s" : ""} pending approval
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Review on the Programs page</p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo("programs")}
              className="text-xs font-medium bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Review
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
