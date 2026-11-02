
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

  const navigate = useNavigate();

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

        const list = Array.isArray(data.hostels)
          ? data.hostels
          : [];

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
