import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/Logo.png";
import { getMyCampus } from "../../api/campus";
import Skeleton from "../Skeleton";
import CampusDetailsTab from "./CampusDetailsTab";
import CampusImagesTab from "./CampusImagesTab";
import CampusProgramsTab from "./CampusProgramsTab";
import ProfileTab from "../university/ProfileTab";
import { setFlash } from "../../utils/flash";

const TABS = ["Details", "Profile", "Images", "Programs"];

export default function CampusPanel({ ownerUid, adminEmail }) {
  const navigate = useNavigate();
  const [active, setActive] = useState("Details");
  const [campus, setCampus] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const load = async () => {
    try {
      const data = await getMyCampus(ownerUid);
      setCampus(data);
      if (!data) setActive("Details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

  }, [ownerUid]);

  const handleLogout = () => {
    const name = (JSON.parse(sessionStorage.getItem("user") || "{}").name || "").split(" ")[0];
    sessionStorage.clear();
    setFlash(name ? `👋 Thanks ${name}, see you soon!` : "👋 Thanks for visiting — see you soon!");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-['Poppins',sans-serif]">

      <aside className="w-64 bg-[#1e293b] text-white flex flex-col">
        <div className="flex items-center gap-2 px-6 py-6 border-b border-white/10">
          <img src={logo} alt="logo" className="w-8" />
          <span className="text-lg font-semibold">
            Uni <span className="text-[#c88410]">Finder</span>
          </span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={`w-full text-left px-3 py-2 rounded-lg font-medium transition ${
                active === t ? "bg-[#c88410]/20 text-[#f3c277]" : "text-gray-300 hover:bg-white/5"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="m-4 py-2 rounded-lg bg-red-500/90 hover:bg-red-600 transition"
        >
          Logout
        </button>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-medium">
            ✅ Approved
            {campus?.university_name ? ` — part of ${campus.university_name}` : ""}
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mt-3">
            {campus?.name || "Your Campus"}
          </h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500">{adminEmail}</span>
            {user.assigned_id && (
              <span className="text-[#c88410] font-semibold">ID: {user.assigned_id}</span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-3xl space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-40" />
          </div>
        ) : active === "Details" ? (
          <CampusDetailsTab ownerUid={ownerUid} initial={campus} onSaved={load} />
        ) : active === "Profile" ? (
          <ProfileTab uid={ownerUid} />
        ) : !campus ? (
          <Placeholder note="Save your Campus Details first to unlock this section." />
        ) : active === "Images" ? (
          <CampusImagesTab campusId={campus.id} />
        ) : active === "Programs" ? (
          <CampusProgramsTab campusId={campus.id} universityId={campus.university_id} />
        ) : null}
      </main>
    </div>
  );
}

function Placeholder({ note }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center text-gray-500">
      {note}
    </div>
  );
}
