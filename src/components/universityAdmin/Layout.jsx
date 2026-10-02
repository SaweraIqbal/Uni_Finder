import {
  BarChart3,
  Bell,
  BookOpen,
  Clock,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  X,
} from "lucide-react";
import logo from "../../assets/Logo.png";
import { useUniversityAdmin } from "./UniversityAdminContext";
import { Tooltip } from "./ui";

const NAV_ITEMS = [
  { page: "overview",          label: "Overview",          Icon: LayoutDashboard },
  { page: "profile",           label: "University Profile", Icon: GraduationCap },
  { page: "campuses",          label: "Campus Approvals",   Icon: MapPin,    badgeKey: "campus" },
  { page: "programs",          label: "Programs",           Icon: BookOpen },
  { page: "program-requests",  label: "Program Requests",   Icon: FileText,  badgeKey: "programRequest" },
  { page: "activity",          label: "Activity Log",       Icon: BarChart3 },
];

function SidebarNav() {
  const {
    currentPage,
    navigateTo,
    campusRequests,
    programRequests,
    stats,
    adminName,
    adminInitials,
    onLogout,
    setSidebarOpen,
  } = useUniversityAdmin();

  const pendingCampus   = campusRequests.filter((r) => r.status === "pending").length;
  const pendingProgReq  = stats?.pending_programs ?? 0;  // real count from /me/stats

  const getBadge = (key) => {
    if (key === "campus")         return pendingCampus;
    if (key === "programRequest") return pendingProgReq;
    return 0;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 py-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="UniFinder" className="w-9 h-9 object-contain" />
          <div>
            <p className="text-white text-sm font-semibold leading-tight">
              Uni<span className="text-orange-500">Finder</span>
            </p>
            <p className="text-slate-400 text-xs">Admin Portal</p>
          </div>
        </div>
        <button
          type="button"
          className="lg:hidden text-slate-400 hover:text-white"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ page, label, Icon, badgeKey }) => {
          const isActive = currentPage === page;
          const badge = getBadge(badgeKey);
          return (
            <button
              type="button"
              key={page}
              onClick={() => navigateTo(page)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left transition-all ${
                isActive
                  ? "bg-orange-500 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full tabular-nums font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-orange-500 text-white"
                  }`}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold">
            {adminInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">
              {adminName}
            </p>
            <p className="text-slate-400 text-xs truncate">University Admin</p>
          </div>
        </div>
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 transition flex items-center justify-center gap-2 text-white text-sm font-semibold"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        )}
      </div>
    </div>
  );
}

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUniversityAdmin();

  return (
    <>
      {/* Desktop sidebar — fixed width, never overflows */}
      <aside className="hidden lg:flex w-60 xl:w-64 shrink-0 bg-slate-900 flex-col h-full overflow-hidden">
        <SidebarNav />
      </aside>

      {/* Mobile overlay sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="w-64 max-w-[80vw] bg-slate-900 h-full shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarNav />
          </div>
          <div className="flex-1 bg-black/50" />
        </div>
      )}
    </>
  );
}

const verificationConfig = {
  unverified: {
    label: "Unverified",
    bg: "bg-red-100",
    text: "text-red-700",
    dot: "bg-red-500",
    tooltip:
      "Your university is not yet verified. Complete domain or letter verification to enable approval actions.",
  },
  link_sent: {
    label: "Domain Verification Sent",
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
    tooltip:
      "A verification link has been sent to your official domain email. Awaiting click confirmation.",
  },
  verified: {
    label: "Verified",
    bg: "bg-green-100",
    text: "text-green-700",
    dot: "bg-green-500",
    tooltip:
      "Your university is fully verified. All approval actions are enabled.",
  },
};

export function Header() {
  const {
    university,
    stats,
    campusRequests,
    programRequests,
    notificationOpen,
    setNotificationOpen,
    navigateTo,
    universityName,
    city,
    established,
    setSidebarOpen,
  } = useUniversityAdmin();

  // Derive verification badge from real API data
  const domainVerified = university?.verification?.domain_verified === true;
  const loeOnFile      = university?.verification?.loe_on_file     === true;
  const appStatus      = (university?.verification?.status || "").toLowerCase();

  const cfg = domainVerified
    ? verificationConfig.verified
    : loeOnFile || appStatus === "pending"
      ? { label: "Pending Review", bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500",
          tooltip: "Your verification is under review by the super admin." }
      : verificationConfig.unverified;

  const pendingCampus  = campusRequests.filter((r) => r.status === "pending");
  const pendingProgram = programRequests.filter((r) => r.status === "pending");
  const totalPending   = pendingCampus.length + pendingProgram.length + (stats?.pending_programs ?? 0);

  const recentNotifications = [
    ...pendingCampus.slice(0, 2).map((r) => ({
      id: r.id,
      label: `Campus: ${r.name}`,
      sub: "Pending your review",
      page: "campuses",
    })),
    ...pendingProgram.slice(0, 1).map((r) => ({
      id: r.id,
      label: `Program: ${r.programName}`,
      sub: "Pending your review",
      page: "program-requests",
    })),
  ].slice(0, 3);

  return (
    <header className="bg-white border-b border-slate-100 px-4 sm:px-6 py-3 flex items-center gap-3 shrink-0 z-10 overflow-visible">
      <button
        type="button"
        className="lg:hidden text-slate-500 hover:text-slate-800 shrink-0"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-slate-800 truncate">
          {universityName}
        </h1>
        <p className="text-xs text-slate-400 truncate">
          {city} · {established}
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <Tooltip text={cfg.tooltip}>
          <div
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium cursor-help ${cfg.bg} ${cfg.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </div>
        </Tooltip>

        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationOpen((isOpen) => !isOpen)}
            className="relative p-2 rounded-xl hover:bg-gray-100 text-slate-600 transition-colors"
            aria-label="Toggle pending notifications"
            aria-expanded={notificationOpen}
          >
            <Bell className="w-4 h-4" />
            {totalPending > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {totalPending}
              </span>
            )}
          </button>

          {notificationOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setNotificationOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-slate-100 z-40 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-800">
                    Pending Actions
                  </p>
                  <button
                    type="button"
                    onClick={() => setNotificationOpen(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {recentNotifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-slate-400">
                    No pending actions
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {recentNotifications.map((n) => (
                      <button
                        type="button"
                        key={n.id}
                        onClick={() => {
                          navigateTo(n.page);
                          setNotificationOpen(false);
                        }}
                        className="flex items-start gap-3 px-4 py-3 w-full text-left hover:bg-orange-50 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {n.label}
                          </p>
                          <p className="text-xs text-slate-400">{n.sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const syncDate = new Date();
  syncDate.setDate(syncDate.getDate() - 5);
  const formatted = syncDate.toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <footer className="bg-white border-t border-slate-100 px-6 py-2 shrink-0">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
        <p className="text-xs text-slate-400">
          Last HEC Data Sync:{" "}
          <span className="tabular-nums text-slate-500">{formatted}</span>
        </p>
      </div>
    </footer>
  );
}
