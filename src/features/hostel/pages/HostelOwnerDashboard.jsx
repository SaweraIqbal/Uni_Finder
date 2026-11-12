
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import HostelOwnerLayout, {
  NAV_ITEMS,
} from "../owner/HostelOwnerLayout";

import OverviewSection from "../owner/OverviewSection";
import ProfileSection from "../owner/ProfileSection";
import ListingSection from "../owner/ListingSection";
import ListingPreviewSection from "../owner/ListingPreviewSection";
import { API } from "../../../shared/api/client";

const emptyDetails = { profile: {}, rooms: [], listing: null, photos: [] };

export default function HostelOwnerDashboard() {
  const [active, setActive] = useState("overview");
  const [hostels, setHostels] = useState([]);
  const [selectedHostelId, setSelectedHostelId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [details, setDetails] = useState(emptyDetails);
  const [completion, setCompletion] = useState(null);
  const [campuses, setCampuses] = useState([]);
  const [ownerName, setOwnerName] = useState("Hostel Owner");

  const navigate = useNavigate();
  const user = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem("user") || "{}"); }
    catch { return {}; }
  }, []);
  const registrationRole = user.role === "campus_hostel" ? "campus_hostel" : "hostel";
  const campusHostel = registrationRole === "campus_hostel";

  const title =
    NAV_ITEMS.find((n) => n.id === active)?.label ?? "Overview";

  useEffect(() => {
    const loadHostels = async () => {
      try {
        setLoading(true);
        setError("");

        const token = sessionStorage.getItem("token");

        if (!token) {
          throw new Error("Please login again.");
        }

        const response = await fetch(`${API}/api/hostels/mine`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load hostels"
          );
        }

        const allHostels = Array.isArray(data.hostels)
          ? data.hostels
          : [];
        const roleHostels = allHostels.filter((hostel) =>
          campusHostel ? hostel.hostel_type === "university" : hostel.hostel_type === "private"
        );
        const list = roleHostels;
        setHostels(list);

        setSelectedHostelId((previousId) => {
          const stillExists = list.some(
            (hostel) => hostel.id === previousId
          );

          return stillExists
            ? previousId
            : list[0]?.id || "";
        });
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    loadHostels();
    fetch(`${API}/api/campuses`).then((res) => res.json()).then((data) => {
      setCampuses(Array.isArray(data) ? data : data.campuses || []);
    }).catch(() => {});
  }, [campusHostel]);

  const selectedHostel = hostels.find(
    (hostel) => hostel.id === selectedHostelId
  );

  useEffect(() => {
    if (!selectedHostel) return;

    let cancelled = false;
    const token = sessionStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    const base = `${API}/api/hostels/${selectedHostel.id}`;

    const loadDetails = async () => {
      try {
        const [profileRes, roomsRes, listingRes, photosRes, completionRes] =
          await Promise.all([
            fetch(`${base}/profile`, { headers }).then((res) => res.json()),
            fetch(`${base}/rooms`, { headers }).then((res) => res.json()),
            fetch(`${base}/listing`, { headers }).then((res) => res.json()),
            fetch(`${base}/photos`, { headers }).then((res) => res.json()),
            fetch(`${base}/completion`, { headers }).then((res) => res.json()),
          ]);

        if (cancelled) return;

        const profile = profileRes.profile || {};
        setOwnerName(profile.owner_name || user.name || user.full_name || "Hostel Owner");
        setDetails({
          profile,
          rooms: Array.isArray(roomsRes.rooms) ? roomsRes.rooms : [],
          listing: listingRes.listing || null,
          photos: Array.isArray(photosRes.photos) ? photosRes.photos : [],
        });
        setCompletion(completionRes.completion || null);
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load dashboard details.");
      }
    };

    loadDetails();
    return () => { cancelled = true; };
  }, [active, selectedHostel, user]);

  const effectiveCompletion = completion || selectedHostel?.completion || null;
  const overview = {
    status: effectiveCompletion?.displayStatus || "pending_approval",
    approvalStatus:
      effectiveCompletion?.approvalStatus || selectedHostel?.status || "pending_admin",
    reviewerLabel:
      (effectiveCompletion?.approvalStatus || selectedHostel?.status) ===
      "pending_campus"
        ? `the campus admin of ${selectedHostel?.campus_name || "your campus"}`
        : "the UniFinder super admin",
    rejectionReason: selectedHostel?.review_reason || "",
    completeness: effectiveCompletion?.completeness ?? 0,
    profileCompleteness: effectiveCompletion?.profileCompleteness ?? 0,
    listingCompleteness: effectiveCompletion?.listingCompleteness ?? 0,
    counts: effectiveCompletion?.counts || {},
    missing: effectiveCompletion?.missing || [],
    totalChecks:
      (effectiveCompletion?.profileChecks?.length || 0) +
      (effectiveCompletion?.listingChecks?.length || 0),
    hostelType: campusHostel ? "campus" : "private",
    campusName: selectedHostel?.campus_name || "",
  };

  const handleSignOut = () => {
    sessionStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <HostelOwnerLayout
      active={active}
      onNavigate={setActive}
      onSignOut={handleSignOut}
      owner={{ name: ownerName, hostelName: selectedHostel?.name || (campusHostel ? "Campus Hostel" : "Independent Hostel") }}
      title={`${campusHostel ? "Campus Hostel" : "Independent Hostel"} · ${title}`}
      status={overview.status}
      approvalStatus={overview.approvalStatus}
    >
      {loading && (
        <p className="mb-4 text-sm text-slate-500">
          Loading hostels...
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 p-4 text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && !selectedHostel && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">
            This account has no hostel yet. Register one to start listing rooms, photos and amenities.
          </p>
          <button
            type="button"
            onClick={() => navigate(`/hostel/register/${registrationRole}`, { replace: true })}
            className="rounded-xl bg-[#ff6a00] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e65f00]"
          >
            Register hostel
          </button>
        </div>
      )}

      {!loading && !error && selectedHostel && (
        <>
          {hostels.length > 0 && (
            <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4">
              <label
                htmlFor="selected-hostel"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Select Hostel
              </label>

              <select
                id="selected-hostel"
                value={selectedHostelId}
                onChange={(e) =>
                  setSelectedHostelId(e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 p-3"
              >
                {hostels.map((hostel) => (
                  <option
                    key={hostel.id}
                    value={hostel.id}
                  >
                    {hostel.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {active === "overview" ? (
            <OverviewSection
              data={overview}
              onNavigate={setActive}
            />
          ) : active === "profile" ? (
            selectedHostel ? (
              <ProfileSection
                key={selectedHostel.id}
                hostelId={selectedHostel.id}
                initial={{ verification: "approved", gender: "boys", ownership: campusHostel ? "campus" : "private", campusId: "", owner: {}, warden: {} }}
                campuses={campuses}
                hostelRole={registrationRole}
              />
            ) : (
              <p className="rounded-xl bg-amber-50 p-4 text-amber-800">
                No hostel records found for this account.
              </p>
            )
          ) : active === "listing" ? (
            selectedHostel ? (
              <ListingSection
                key={selectedHostel.id}
                hostelId={selectedHostel.id}
              />
            ) : (
              <p className="rounded-xl bg-amber-50 p-4 text-amber-800">
                No hostel records found for this account.
              </p>
            )
          ) : (
            <ListingPreviewSection
              hostel={selectedHostel}
              completion={effectiveCompletion}
              listing={details.listing}
              photos={details.photos}
              onNavigate={setActive}
            />
          )}
        </>
      )}
    </HostelOwnerLayout>
  );
}
