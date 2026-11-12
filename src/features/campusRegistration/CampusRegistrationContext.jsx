import {
  createContext, useCallback, useContext,
  useEffect, useRef, useState,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API, authHeaders } from "../../shared/api/client";

export const STATUSES = {
  NEW:                    "new",
  PENDING:                "pending",
  REJECTED:               "rejected",
  RESUBMISSION_REQUESTED: "resubmission_requested",
  APPROVED:               "approved",
};

const CampusRegistrationContext = createContext(null);

export function CampusRegistrationProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [registration, setRegistration] = useState(null);
  const [status,       setStatus]       = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [fetchError,   setFetchError]   = useState(null);

  const fetchedRef = useRef(false);

  const fetchMine = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`${API}/api/campus-registrations/mine`, {
        headers: authHeaders(),
      });
      if (res.status === 404 || res.status === 401) {

        setRegistration(null);
        setStatus(STATUSES.NEW);
        return;
      }
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const { data } = await res.json();
      if (!data) {
        setRegistration(null);
        setStatus(STATUSES.NEW);
      } else {
        setRegistration(data);
        setStatus(data.status || STATUSES.PENDING);
      }
    } catch (e) {
      setFetchError(e.message);
      setRegistration(null);
      setStatus(STATUSES.NEW);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchMine();
  }, [fetchMine]);

  useEffect(() => {
    if (loading || status === null) return;
    const onRegPage    = location.pathname === "/campus/register";
    const onStatusPage = location.pathname === "/campus/registration-status";
    if (!onRegPage && !onStatusPage) return;

    if (status === STATUSES.NEW && !onRegPage) {
      navigate("/campus/register", { replace: true });
    } else if (
      status !== STATUSES.NEW &&
      status !== STATUSES.REJECTED &&
      status !== STATUSES.RESUBMISSION_REQUESTED &&
      !onStatusPage
    ) {

      navigate("/campus/registration-status", { replace: true });
    } else if (
      (status === STATUSES.REJECTED || status === STATUSES.RESUBMISSION_REQUESTED) &&
      !onRegPage && !onStatusPage
    ) {
      navigate("/campus/registration-status", { replace: true });
    }
  }, [loading, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(() => {
    fetchedRef.current = false;
    fetchMine();
  }, [fetchMine]);

  return (
    <CampusRegistrationContext.Provider
      value={{
        registration,
        status,
        loading,
        fetchError,
        refresh,
        STATUSES,

        setRegistration,
        setStatus,
      }}
    >
      {children}
    </CampusRegistrationContext.Provider>
  );
}

export function useCampusRegistration() {
  const ctx = useContext(CampusRegistrationContext);
  if (!ctx) throw new Error("useCampusRegistration must be inside CampusRegistrationProvider");
  return ctx;
}
