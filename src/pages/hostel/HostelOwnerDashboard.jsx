
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import HostelOwnerLayout, {
  NAV_ITEMS,
} from "../../components/hostelOwner/HostelOwnerLayout";

import OverviewSection from "../../components/hostelOwner/OverviewSection";
import ProfileSection from "../../components/hostelOwner/ProfileSection";
import ListingSection from "../../components/hostelOwner/ListingSection";
import StatusSection from "../../components/hostelOwner/StatusSection";

import {
  mockOwner,
  mockOverview,
  mockProfile,
  mockCampuses,
} from "../../components/hostelOwner/mockData";

const API = "http://localhost:5000";

export default function HostelOwnerDashboard() {
  const [active, setActive] = useState("overview");
  const [hostels, setHostels] = useState([]);
  const [selectedHostelId, setSelectedHostelId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lockedStatus, setLockedStatus] = useState(null);

  const navigate = useNavigate();
  let registrationRole = "hostel";
  try {
    registrationRole = JSON.parse(sessionStorage.getItem("user") || "{}").role || registrationRole;
  } catch { /* use the independent-hostel default */ }

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
        const list = allHostels.filter((hostel) => hostel.status === "approved");

        if (list.length === 0) {
          setLockedStatus(allHostels[0] || { status: "not_submitted" });
          setHostels([]);
          setLoading(false);
          return;
        }

        setLockedStatus(null);
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

  if (!loading && !error && lockedStatus) {
    const statusMessage = lockedStatus.status === "rejected"
      ? `Your registration was rejected.${lockedStatus.review_reason ? ` Reason: ${lockedStatus.review_reason}` : " Contact the reviewer before submitting again."}`
      : lockedStatus.status === "pending_campus"
        ? "Your campus hostel request is waiting for the campus admin's review. Dashboard access will be enabled after approval."
        : lockedStatus.status === "pending_admin"
          ? "Your hostel request is waiting for the super admin's review. Dashboard access will be enabled after approval."
          : "Submit a hostel registration before opening the dashboard.";
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <section className="mx-auto mt-16 max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-800">Hostel dashboard locked</h1>
          <p className="mt-3 text-sm text-slate-600">{statusMessage}</p>
          <button onClick={() => navigate(`/hostel/register/${registrationRole}`)} className="mt-6 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600">
            View registration
          </button>
        </section>
      </main>
    );
  }

    loadHostels();
  }, []);

  const selectedHostel = hostels.find(
    (hostel) => hostel.id === selectedHostelId
  );

  const handleSignOut = () => {
    sessionStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <HostelOwnerLayout
      active={active}
      onNavigate={setActive}
      onSignOut={handleSignOut}
      owner={mockOwner}
      title={title}
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

      {!loading && !error && (
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
                    {hostel.name} ({hostel.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {active === "overview" ? (
            <OverviewSection
              data={mockOverview}
              onNavigate={setActive}
            />
          ) : active === "profile" ? (
            selectedHostel ? (
              <ProfileSection
                key={selectedHostel.id}
                hostelId={selectedHostel.id}
                initial={mockProfile}
                campuses={mockCampuses}
              />
            ) : (
              <p className="rounded-xl bg-amber-50 p-4 text-amber-800">
                No hostel found. Create a hostel first.
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
                No hostel found. Create a hostel first.
              </p>
            )
          ) : (
            <StatusSection />
          )}
        </>
      )}
    </HostelOwnerLayout>
  );
}
