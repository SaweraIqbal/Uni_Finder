import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import { getMe, getMeStats, getMeActivity, uniAdminListCampusRegistrations } from "../../university/api/university";

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

  universityName: propUniversityName = "",
  adminName:      propAdminName      = "",
  adminEmail:     propAdminEmail     = "",
}) {
  const [currentPage,      setCurrentPage]      = useState("overview");
  const [sideSheet,        setSideSheet]        = useState(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [sidebarOpen,      setSidebarOpen]      = useState(false);

  const [university,     setUniversity]     = useState(null);
  const [stats,          setStats]          = useState(null);
  const [activityLog,    setActivityLog]    = useState([]);
  const [campusRequests, setCampusRequests] = useState([]);

  const [loadingMe,            setLoadingMe]            = useState(true);
  const [loadingStats,         setLoadingStats]         = useState(true);
  const [loadingActivity,      setLoadingActivity]      = useState(true);
  const [loadingCampusRequests,setLoadingCampusRequests]= useState(false);
  const [meError,              setMeError]              = useState(null);

  const fetchedRef = useRef(false);

  const universityName = university?.name               || propUniversityName || "";
  const established    = university?.established_year
    ? `Est. ${university.established_year}`
    : "";
  const city           = university?.city || "";
  const adminName      = propAdminName  || "";
  const adminEmail     = propAdminEmail || "";

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

  const fetchCampusRequests = useCallback(async () => {
    if (!sessionStorage.getItem("token")) return;
    setLoadingCampusRequests(true);
    try {
      const { ok, status, data } = await uniAdminListCampusRegistrations();
      if (status === 401 || status === 403) return;
      if (!ok) return;
      setCampusRequests(Array.isArray(data.registrations) ? data.registrations : []);
    } catch {

    } finally {
      setLoadingCampusRequests(false);
    }
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchMe();
    fetchStats();
    fetchActivity();
    fetchCampusRequests();
  }, [fetchMe, fetchStats, fetchActivity, fetchCampusRequests]);

  const refetch = useCallback(() => {
    fetchMe();
    fetchStats();
    fetchActivity();
    fetchCampusRequests();
  }, [fetchMe, fetchStats, fetchActivity, fetchCampusRequests]);

  const navigateTo = useCallback((page) => {
    setCurrentPage(page);
    setNotificationOpen(false);
    setSidebarOpen(false);
  }, []);

  const addToast = useCallback((message, type = "success") => {
    if (type === "error") toast.error(message);
    else if (type === "info") toast.info(message);
    else toast.success(message);
  }, []);

  const openSideSheet  = useCallback((content) => setSideSheet(content), []);
  const closeSideSheet = useCallback(() => setSideSheet(null), []);

  return (
    <UniversityAdminContext.Provider
      value={{

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

        university,
        stats,
        activityLog,
        campusRequests,
        refetch,
        fetchCampusRequests,
        loadingCampusRequests,

        loadingMe,
        loadingStats,
        loadingActivity,
        meError,

        universityName,
        city,
        established,
        adminName,
        adminEmail,
        adminInitials: initialsFrom(adminName),

        programRequests: [],

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
