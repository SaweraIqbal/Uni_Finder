import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import {
  getMyCampus,
  listCampusImages,
  listCampusPrograms,
} from "../../campus/api/campus";
import { API, authHeaders } from "../../../shared/api/client";

const CampusAdminContext = createContext(null);

function initialsFrom(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "CA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function CampusAdminProvider({
  children,
  ownerUid,
  adminName: propAdminName = "Maryam Khan",
  adminEmail: propAdminEmail = "",
  onLogout,
}) {
  const [currentPage, setCurrentPage] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const [campus, setCampus] = useState(null);
  const [images, setImages] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loadingCampus, setLoadingCampus] = useState(true);
  const [hostelRequestCount, setHostelRequestCount] = useState(0);

  const [drawer, setDrawer] = useState(null);

  const [isDirty, setIsDirty] = useState(false);

  const addToast = useCallback((message, type = "success") => {
    if (type === "error") toast.error(message);
    else if (type === "info") toast.info(message);
    else toast.success(message);
  }, []);

  const fetchedRef = useRef(false);

  const fetchCampus = useCallback(async () => {
    if (!ownerUid) return;
    setLoadingCampus(true);
    try {
      const data = await getMyCampus(ownerUid);
      setCampus(data);

      if (data?.id) {
        try {
          const [imgs, progs] = await Promise.all([
            listCampusImages(data.id),
            listCampusPrograms(data.id),
          ]);
          setImages(Array.isArray(imgs) ? imgs : []);
          setPrograms(Array.isArray(progs) ? progs : []);
        } catch {

        }
      }
    } catch {
      setCampus(null);
    } finally {
      setLoadingCampus(false);
    }
  }, [ownerUid]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchCampus();
  }, [fetchCampus]);

  const refreshHostelRequestCount = useCallback(async () => {
    try {
      const response = await fetch(`${API}/api/hostels/review-queue`, { headers: authHeaders() });
      if (!response.ok) return;
      const data = await response.json();
      setHostelRequestCount((data.hostels || []).filter((hostel) => hostel.status.startsWith("pending_")).length);
    } catch {}
  }, []);

  useEffect(() => {
    refreshHostelRequestCount();
    const interval = setInterval(refreshHostelRequestCount, 15000);
    return () => clearInterval(interval);
  }, [refreshHostelRequestCount]);

  const refetch = useCallback(() => {
    fetchedRef.current = false;
    fetchCampus();
  }, [fetchCampus]);

  const navigateTo = useCallback((page) => {
    setCurrentPage(page);
    setNotificationOpen(false);
    setSidebarOpen(false);
    setIsDirty(false);
  }, []);

  const openDrawer = useCallback((content) => setDrawer(content), []);
  const closeDrawer = useCallback(() => setDrawer(null), []);

  const adminName = propAdminName || campus?.admin_name || "Maryam Khan";
  const adminEmail = propAdminEmail || campus?.admin_email || "";

  return (
    <CampusAdminContext.Provider
      value={{

        currentPage,
        navigateTo,
        sidebarOpen,
        setSidebarOpen,
        notificationOpen,
        setNotificationOpen,
        onLogout,

        campus,
        images,
        programs,
        loadingCampus,
        hostelRequestCount,
        setHostelRequestCount,
        refetch,
        ownerUid,

        adminName,
        adminEmail,
        adminInitials: initialsFrom(adminName),

        drawer,
        openDrawer,
        closeDrawer,

        isDirty,
        setIsDirty,

        addToast,
      }}
    >
      {children}
    </CampusAdminContext.Provider>
  );
}

export function useCampusAdmin() {
  const ctx = useContext(CampusAdminContext);
  if (!ctx) throw new Error("useCampusAdmin must be inside CampusAdminProvider");
  return ctx;
}
