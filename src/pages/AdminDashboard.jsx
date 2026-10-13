import { useState, useRef, useDeferredValue, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Home,
  MapPin,
  BookOpen,
  ClipboardList,
  BedDouble,
  BarChart2,
  LogOut,
  Menu,
  X,
  History,
  Bell,
  Clock,
  Camera,
} from "lucide-react";

import Logo from "../assets/Logo.png";

// Imports for child components (kept as is)
import UniversityVerifications from "../components/admin/UniversityVerifications.jsx";
import UniversityProfiles from "../components/admin/UniversityProfiles.jsx";
import CampusApprovals from "../components/admin/CampusApprovals.jsx";
import ProgramManagement from "../components/admin/ProgramManagement.jsx";
import ProgramApprovals from "../components/admin/ProgramApprovals.jsx";
import HostelApprovals from "../components/admin/HostelApprovals.jsx";
import Analytics from "../components/admin/Analytics.jsx";
import ActivityLog from "../components/admin/ActivityLog.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { setFlash } from "../utils/flash.js";

import {
  listVerifications,
  adminListCampusRegistrations,
  adminListProgramRequests,
} from "../api/verification.js";

function renderScreen(screen, navigate) {
  switch (screen) {
    case "verifications":
      return <UniversityVerifications />;
    case "profiles":
      return <UniversityProfiles />;
    case "campus-approvals":
      return <CampusApprovals />;
    case "programs":
      return <ProgramManagement />;
    case "program-approvals":
      return <ProgramApprovals />;
    case "hostel-approvals":
      return <HostelApprovals />;
    case "analytics":
      return <Analytics onNavigate={navigate} />;
    case "activity-log":
      return <ActivityLog />;
    default:
      return <UniversityVerifications />;
  }
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [active, setActive] = useState("verifications");
  const activeScreen = useDeferredValue(active);
  const isPending = active !== activeScreen;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null);

  const [counts, setCounts] = useState({
    verifications: 0,
    campus: 0,
    programs: 0,
    hostels: 2,
  });
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!sessionStorage.getItem("token")) return;
    try {
      setLoadingNotifications(true);
      const [verRes, campusRes, progRes] = await Promise.allSettled([
        listVerifications("pending"),
        adminListCampusRegistrations({ status: "pending", limit: 50 }),
        adminListProgramRequests({ status: "pending", limit: 50 }),
      ]);

      const items = [];
      let verCount = 0;
      let campusCount = 0;
      let progCount = 0;

      // 1. University Verifications
      if (verRes.status === "fulfilled" && verRes.value?.ok) {
        const verList = Array.isArray(verRes.value.data) ? verRes.value.data : [];
        verCount = verList.length;
        verList.forEach((v) => {
          items.push({
            id: `ver-${v.id}`,
            type: "university",
            title: `University: ${v.university_name || v.name || "University Verification"}`,
            description: `Pending verification for ${v.full_name || v.official_email || "Admin"}`,
            targetScreen: "verifications",
            date: v.created_at,
          });
        });
      }

      // 2. Campus Approvals
      if (campusRes.status === "fulfilled" && campusRes.value?.ok) {
        const cData = campusRes.value.data;
        const cList = Array.isArray(cData?.registrations)
          ? cData.registrations
          : Array.isArray(cData)
          ? cData
          : [];
        campusCount = cData?.stats?.pending ?? cList.length;
        cList.forEach((c) => {
          items.push({
            id: `campus-${c.id}`,
            type: "campus",
            title: `Campus: ${c.officialName || c.name || "Campus Registration"}`,
            description: `Pending your review · ${c.city || "Campus"}`,
            targetScreen: "campus-approvals",
            date: c.submittedAt || c.created_at,
          });
        });
      }

      // 3. Program Approvals
      if (progRes.status === "fulfilled" && progRes.value?.ok) {
        const pData = progRes.value.data;
        const pList = Array.isArray(pData?.requests) ? pData.requests : [];
        progCount = pData?.total ?? pList.length;
        pList.forEach((p) => {
          items.push({
            id: `prog-${p.id}`,
            type: "program",
            title: `Program: ${p.name || "Program Request"}`,
            description: `Pending review · ${p.university_name || "University"}`,
            targetScreen: "program-approvals",
            date: p.created_at,
          });
        });
      }

      // 4. Hostel Approvals
      const hostelItems = [
        {
          id: "hostel-1",
          type: "hostel",
          title: "Hostel: Al-Noor Boys Hostel",
          description: "Pending Admin Approval · Lahore",
          targetScreen: "hostel-approvals",
        },
        {
          id: "hostel-3",
          type: "hostel",
          title: "Hostel: FAST Boys Residence",
          description: "Pending Admin Approval · Faisalabad",
          targetScreen: "hostel-approvals",
        },
      ];
      items.push(...hostelItems);
      const hostelCount = hostelItems.length;

      setCounts({
        verifications: verCount,
        campus: campusCount,
        programs: progCount,
        hostels: hostelCount,
      });

      setNotifications(items);
    } catch (e) {
      console.error("Failed to load notifications:", e);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const navItems = [
    {
      id: "verifications",
      label: "University Verifications",
      icon: <Shield size={18} />,
      badge: counts.verifications > 0 ? counts.verifications : null,
    },
    { id: "profiles", label: "University Profiles", icon: <Home size={18} /> },
    {
      id: "campus-approvals",
      label: "Campus Approvals",
      icon: <MapPin size={18} />,
      badge: counts.campus > 0 ? counts.campus : null,
    },
    { id: "programs", label: "Program Management", icon: <BookOpen size={18} /> },
    {
      id: "program-approvals",
      label: "Program Approvals",
      icon: <ClipboardList size={18} />,
      badge: counts.programs > 0 ? counts.programs : null,
    },
    {
      id: "hostel-approvals",
      label: "Hostel Approvals",
      icon: <BedDouble size={18} />,
      badge: counts.hostels > 0 ? counts.hostels : null,
    },
    { id: "analytics", label: "Analytics", icon: <BarChart2 size={18} /> },
    { id: "activity-log", label: "Activity Log", icon: <History size={18} /> },
  ];

  const handleNavClick = (id) => {
    setActive(id);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleNotificationClick = (targetScreen) => {
    setActive(targetScreen);
    setNotificationsOpen(false);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogout = () => {
    const name = (user?.name || "").split(" ")[0];
    logout();
    sessionStorage.clear();
    setFlash(
      name
        ? `👋 Thanks ${name}, see you soon!`
        : "👋 Thanks for visiting — see you soon!",
    );
    navigate("/login", { replace: true });
  };

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      {/* Fixed on all screens, translated on mobile to hide, always visible on lg */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 
          bg-slate-900 flex flex-col h-full
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        aria-label="Main navigation"
      >
        {/* Logo Area */}
        <div className="px-6 pt-4 pb-3 border-b border-slate-700 flex items-center justify-between">
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

          {/* Close Button (Mobile Only) */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md focus:outline-none"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav
          className="px-4 pt-4 flex-1 overflow-y-auto"
          aria-label="Sidebar navigation"
        >
          <ul className="space-y-1.5 pb-4">
            {navItems.map((item) => {
              const isActive = active === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(item.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 text-left focus:outline-none ${
                      isActive
                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                        : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                    }`}
                  >
                    <span
                      className={`shrink-0 transition-colors duration-200 ${
                        isActive ? "text-white" : "text-slate-400"
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge != null && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[17px] text-center leading-tight shrink-0 transition-colors duration-200 ${
                          isActive
                            ? "bg-white text-orange-600"
                            : "bg-orange-500 text-white"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="px-3 pb-6 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      {/* lg:ml-64 adds margin to the left on desktop so content isn't hidden behind the fixed sidebar */}
      <div className="flex-1 flex flex-col min-w-0 w-full lg:ml-64 transition-all duration-300">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 h-16 shrink-0 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm z-10">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-600 transition-colors"
            aria-label="Open navigation"
          >
            <Menu size={24} />
          </button>

          {/* Right Side: Profile & Notifications */}
          <div className="ml-auto flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  if (!notificationsOpen) loadNotifications();
                }}
                className="relative p-2 rounded-full transition-colors hover:bg-gray-100"
                aria-label="Notifications"
              >
                <Bell size={20} className="text-slate-600" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-orange-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full min-w-[14px] text-center leading-none">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setNotificationsOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-30 max-h-[420px] overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 rounded-t-xl flex items-center justify-between z-10">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800 text-base">
                          Pending Actions
                        </h3>
                        {notifications.length > 0 && (
                          <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full">
                            {notifications.length}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setNotificationsOpen(false)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg focus:outline-none"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="py-2 divide-y divide-gray-50">
                      {loadingNotifications && notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-slate-400 text-sm">
                          Loading actions…
                        </div>
                      ) : notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() =>
                              handleNotificationClick(notification.targetScreen)
                            }
                            className="w-full px-4 py-3 hover:bg-orange-50/50 transition-colors text-left flex items-start gap-3 group"
                          >
                            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0 group-hover:bg-orange-200 transition-colors mt-0.5">
                              <Clock size={16} className="text-orange-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-800 text-sm mb-0.5 truncate group-hover:text-orange-600 transition-colors">
                                {notification.title}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {notification.description}
                              </p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-slate-500 text-sm">
                          No pending actions
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow-sm flex items-center gap-3 px-3 py-1.5 border border-gray-200">
              <div className="relative group">
                <button
                  onClick={handleProfileClick}
                  className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-orange-600 flex items-center justify-center text-white text-xs font-bold">
                      SA
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera size={14} className="text-white" />
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  aria-label="Upload profile picture"
                />
              </div>
              <div className="hidden md:block">
                <p className="text-slate-800 font-semibold text-sm leading-tight">
                  SuperAdmin
                </p>
                <p className="text-slate-500 text-[11px] leading-tight">
                  superadmin@unifinder.com
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          <div
            className={`max-w-[1600px] mx-auto transition-opacity duration-150 ${
              isPending ? "opacity-50" : "opacity-100"
            }`}
          >
            {renderScreen(activeScreen, setActive)}
          </div>
        </main>
      </div>
    </div>
  );
}
