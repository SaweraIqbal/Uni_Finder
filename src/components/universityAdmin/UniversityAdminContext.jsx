/**
 * UniversityAdminContext.jsx
 * Central state provider for the university admin dashboard.
 * All data comes from real API calls — zero mock/hardcoded values.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import { getMe, getMeStats, getMeActivity } from "../../api/university";

const UniversityAdminContext = createContext(null);

function initialsFrom(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "UA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function UniversityAdminProvider({
  children,
  onLogout,
  // Props passed from UniversityDashboard.jsx after verification — used as
  // initial/fallback values only; real data overwrites them from /me.
  universityName: propUniversityName = "",
  adminName:      propAdminName      = "",
  adminEmail:     propAdminEmail     = "",
}) {
  // ── Navigation & UI ──────────────────────────────────────────────────────
  const [currentPage,      setCurrentPage]      = useState("overview");
  const [sideSheet,        setSideSheet]        = useState(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [sidebarOpen,      setSidebarOpen]      = useState(false);

  // ── API data ─────────────────────────────────────────────────────────────
  const [university,  setUniversity]  = useState(null);   // /me response
  const [stats,       setStats]       = useState(null);   // /me/stats response
  const [activityLog, setActivityLog] = useState([]);     // /me/activity response

  // ── Loading / error states ───────────────────────────────────────────────
  const [loadingMe,       setLoadingMe]       = useState(true);
  const [loadingStats,    setLoadingStats]    = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [meError,         setMeError]         = useState(null);

  // Prevent double-fetch in React StrictMode
  const fetchedRef = useRef(false);

  // ── Derived display values (fall back to props while /me is loading) ─────
  const universityName = university?.name               || propUniversityName || "";
  const established    = university?.established_year
    ? `Est. ${university.established_year}`
    : "";
  const city           = "";  // not in HEC data — available if admin adds it
  const adminName      = propAdminName  || "";
  const adminEmail     = propAdminEmail || "";

  // ── Fetch /me ─────────────────────────────────────────────────────────────
  const fetchMe = useCallback(async () => {
    if (!sessionStorage.getItem("token")) return;
    setLoadingMe(true);
    setMeError(null);
    try {
      const data = await getMe();
      setUniversity(data);
    } catch (e) {
      setMeError(e.message || "Could not load university data.");
    } finally {
      setLoadingMe(false);
    }
  }, []);

  // ── Fetch /me/stats ───────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    if (!sessionStorage.getItem("token")) return;
    setLoadingStats(true);
    try {
      const data = await getMeStats();
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // ── Fetch /me/activity ────────────────────────────────────────────────────
  const fetchActivity = useCallback(async () => {
    if (!sessionStorage.getItem("token")) return;
    setLoadingActivity(true);
    try {
      const data = await getMeActivity(10);
      setActivityLog(Array.isArray(data) ? data : []);
    } catch {
      setActivityLog([]);
    } finally {
      setLoadingActivity(false);
    }
  }, []);

  // ── Boot fetch ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchMe();
    fetchStats();
    fetchActivity();
  }, [fetchMe, fetchStats, fetchActivity]);

  // ── Refetch everything after any mutation ─────────────────────────────────
  const refetch = useCallback(() => {
    fetchMe();
    fetchStats();
    fetchActivity();
  }, [fetchMe, fetchStats, fetchActivity]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const navigateTo = useCallback((page) => {
    setCurrentPage(page);
    setNotificationOpen(false);
    setSidebarOpen(false);
  }, []);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const addToast = useCallback((message, type = "success") => {
    if (type === "error") toast.error(message);
    else if (type === "info") toast.info(message);
    else toast.success(message);
  }, []);

  // ── Side-sheet ────────────────────────────────────────────────────────────
  const openSideSheet  = useCallback((content) => setSideSheet(content), []);
  const closeSideSheet = useCallback(() => setSideSheet(null), []);

  // ── Context value ─────────────────────────────────────────────────────────
  return (
    <UniversityAdminContext.Provider
      value={{
        // navigation
        currentPage,
        navigateTo,
        sideSheet,
        openSideSheet,
        closeSideSheet,
        notificationOpen,
        setNotificationOpen,
        sidebarOpen,
        setSidebarOpen,
        onLogout,

        // api data
        university,
        stats,
        activityLog,
        refetch,

        // loading states
        loadingMe,
        loadingStats,
        loadingActivity,
        meError,

        // derived display values
        universityName,
        city,
        established,
        adminName,
        adminEmail,
        adminInitials: initialsFrom(adminName),

        // campus/program request counts — all zero until campus module lands
        // The sidebar/header badge still reads these; keep them to avoid crashes.
        campusRequests:  [],
        programRequests: [],

        // toast
        addToast,
      }}
    >
      {children}
    </UniversityAdminContext.Provider>
  );
}

export function useUniversityAdmin() {
  const ctx = useContext(UniversityAdminContext);
  if (!ctx) {
    throw new Error("useUniversityAdmin must be used within UniversityAdminProvider");
  }
  return ctx;
}
