/**
 * Layout.jsx  —  Campus Admin Dashboard shell
 * Exports: Sidebar, Header, Footer, Drawer
 */
import {
  Bell,
  BookOpen,
  Building2,
  Camera,
  ClipboardList,
  FileText,
  HotelIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  Waves,
  X,
} from "lucide-react";
import Logo from "../../assets/Logo.png";
import { useCampusAdmin } from "./CampusAdminContext";

/* ─── nav item definitions ───────────────────────────────────────────────── */
export const NAV_ITEMS = [
  { id: "overview",          label: "Overview",            Icon: LayoutDashboard },
  { id: "campus-profile",    label: "Campus Profile",      Icon: Building2 },
  { id: "program-offerings", label: "Program Offerings",   Icon: BookOpen },
  { id: "program-requests",  label: "Program Requests",    Icon: FileText },
  { id: "facilities",        label: "Facilities & Environment", Icon: Waves },
  { id: "gallery",           label: "Gallery",             Icon: Camera },
  { id: "societies",         label: "Societies",           Icon: Users },
  { id: "hostels",           label: "Hostels",             Icon: HotelIcon },
  { id: "hostel-approvals",  label: "Hostel Approvals",    Icon: ShieldCheck, badge: 2 },
];

/* ─── Sidebar nav content ────────────────────────────────────────────────── */
function SidebarNav() {
  const { currentPage, navigateTo, adminName, adminInitials, onLogout, setSidebarOpen } =
    useCampusAdmin();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo Area */}
      <div className="px-6 pt-4 pb-3 border-b border-slate-700 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src={Logo}
              alt="Uni Finder logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-white font-bold text-xl leading-none">
            Uni<span className="text-orange-500">Finder</span>
          </span>
        </div>
        <button
          type="button"
          className="lg:hidden text-slate-400 hover:text-white transition-colors"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar space-y-0.5">
        {NAV_ITEMS.map(({ id, label, Icon, badge }) => {
          const isActive = currentPage === id;
          return (
            <button
              type="button"
              key={id}
              onClick={() => navigateTo(id)}
              aria-current={isActive ? "page" : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left focus:outline-none focus:ring-2 focus:ring-orange-400/50 ${
                isActive
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span className="flex-1 truncate">{label}</span>
              {badge != null && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight shrink-0 ${
                    isActive ? "bg-white/20 text-white" : "bg-amber-500 text-white"
                  }`}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom: admin info + logout */}
      <div className="px-4 pb-5 pt-3 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {adminInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{adminName}</p>
            <p className="text-slate-400 text-xs truncate">Campus Admin</p>
          </div>
        </div>
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Sidebar (desktop fixed + mobile overlay) ───────────────────────────── */
export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useCampusAdmin();

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-slate-900 flex-col h-full overflow-hidden">
        <SidebarNav />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="w-64 bg-slate-900 h-full shadow-2xl flex flex-col overflow-hidden"
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

/* ─── Page titles map ────────────────────────────────────────────────────── */
const PAGE_META = {
  "overview":          { title: "Dashboard Overview",     subtitle: "Tarogil Main Campus · Campus Admin" },
  "campus-profile":    { title: "Campus Profile",          subtitle: "HEC-sourced university data is read-only. Edit campus details below." },
  "program-offerings": { title: "Program Offerings",       subtitle: "Programs this campus actually teaches, with full student-facing details." },
  "program-requests":  { title: "Program Requests",        subtitle: "Request a program not in the university's approved list." },
  "facilities":        { title: "Facilities & Environment", subtitle: "What students will see about campus life." },
  "gallery":           { title: "Campus Gallery",           subtitle: "Students judge your campus by these photos." },
  "societies":         { title: "Societies & Clubs",        subtitle: "Student communities at this campus." },
  "hostels":           { title: "Hostels",                  subtitle: "Campus hostel affiliation and availability." },
  "hostel-approvals":  { title: "Hostel Approvals",         subtitle: "Review campus hostels before forwarding to Super Admin for final approval." },
  "activity":          { title: "Activity Log",              subtitle: "Full history of all actions taken on this campus." },
};

/* ─── Header ─────────────────────────────────────────────────────────────── */
export function Header({ rightContent }) {
  const {
    currentPage,
    notificationOpen,
    setNotificationOpen,
    setSidebarOpen,
    isDirty,
    campus,
  } = useCampusAdmin();

  const meta = PAGE_META[currentPage] || { title: "Dashboard", subtitle: "" };
  const subtitle = currentPage === "overview"
    ? `${campus?.name || "Tarogil Main Campus"} · Campus Admin`
    : meta.subtitle;

  return (
    <header className="bg-white border-b border-gray-200 h-16 shrink-0 flex items-center justify-between px-4 sm:px-6 gap-3 z-10">
      {/* Mobile menu toggle */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-gray-100 transition-colors"
        aria-label="Open navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold text-slate-800 leading-tight truncate">
            {meta.title}
          </h1>
          {isDirty && (
            <span className="flex items-center gap-1 text-xs text-amber-600">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
              Unsaved changes
            </span>
          )}
        </div>
        <p className="text-sm text-slate-400 truncate">{subtitle}</p>
      </div>

      {/* Right slot: action buttons + status pill + bell */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {rightContent}

        {/* Verified pill */}
        <div className="hidden sm:flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
          Verified
        </div>

        {/* Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationOpen((o) => !o)}
            className="relative p-2 rounded-xl hover:bg-gray-100 text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full border-2 border-white" />
          </button>

          {notificationOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setNotificationOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 z-40 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-800">Pending Actions</p>
                  <button type="button" onClick={() => setNotificationOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="divide-y divide-slate-50">
                  {[
                    { label: "BS Psychology — fee structure missing", sub: "Program Offerings" },
                    { label: "Al-Rehmat Hostel awaiting approval", sub: "Hostel Approvals" },
                    { label: "Environment & Policies section empty", sub: "Facilities & Environment" },
                  ].map((n, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3">
                      <span className="w-2 h-2 mt-1.5 rounded-full bg-amber-500 shrink-0" />
                      <div>
                        <p className="text-sm text-slate-800">{n.label}</p>
                        <p className="text-xs text-slate-400">{n.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/* ─── Footer ─────────────────────────────────────────────────────────────── */
export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 px-6 py-2 shrink-0">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
        <p className="text-xs text-slate-400">
          Last HEC Data Sync:{" "}
          <span className="text-slate-500 tabular-nums">27 Sept 2026</span>
        </p>
      </div>
    </footer>
  );
}

/* ─── Right-side Drawer ──────────────────────────────────────────────────── */
export function Drawer() {
  const { drawer, closeDrawer } = useCampusAdmin();
  if (!drawer) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/50 transition-opacity"
        onClick={closeDrawer}
      />
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[480px] bg-white shadow-2xl flex flex-col">
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-base font-semibold text-slate-800">{drawer.title}</h2>
          <button
            type="button"
            onClick={closeDrawer}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{drawer.content}</div>
        {/* Drawer footer */}
        {drawer.footer && (
          <div className="px-6 py-4 border-t border-gray-200 shrink-0">{drawer.footer}</div>
        )}
      </div>
    </>
  );
}
