/**
 * CampusAdminContext.jsx
 * Central state provider for the Campus Admin Dashboard (10-page shell).
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
import {
  getMyCampus,
  listCampusImages,
  listCampusPrograms,
} from "../../api/campus";

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
  // ── Navigation ────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  // ── Data ──────────────────────────────────────────────────────────────────
  const [campus, setCampus] = useState(null);
  const [images, setImages] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loadingCampus, setLoadingCampus] = useState(true);

  // ── Side drawer (shared) ──────────────────────────────────────────────────
  const [drawer, setDrawer] = useState(null); // { title, content }

  // ── Unsaved changes indicator ─────────────────────────────────────────────
  const [isDirty, setIsDirty] = useState(false);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const addToast = useCallback((message, type = "success") => {
    if (type === "error") toast.error(message);
    else if (type === "info") toast.info(message);
    else toast.success(message);
  }, []);

  // prevent double fetch in StrictMode
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
          // non-fatal
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
        // nav
        currentPage,
        navigateTo,
        sidebarOpen,
        setSidebarOpen,
        notificationOpen,
        setNotificationOpen,
        onLogout,

        // campus data
        campus,
        images,
        programs,
        loadingCampus,
        refetch,
        ownerUid,

        // admin identity
        adminName,
        adminEmail,
        adminInitials: initialsFrom(adminName),

        // drawer
        drawer,
        openDrawer,
        closeDrawer,

        // dirty flag
        isDirty,
        setIsDirty,

        // toast
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
