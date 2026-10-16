import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/Logo.png";
import { getMyUniversity } from "../../api/university";
import Skeleton from "./Skeleton";
import DetailsTab from "./DetailsTab";
import ProfileTab from "./ProfileTab";
import ImagesTab from "./ImagesTab";
import ProgramsTab from "./ProgramsTab";
import CampusRequestsTab from "./CampusRequestsTab";
import { setFlash } from "../../utils/flash";

const TABS = ["Details", "Profile", "Images", "Programs", "Campuses", "Users"];

export default function UniversityPanel({ ownerUid, adminEmail }) {
  const navigate = useNavigate();
  const [active, setActive] = useState("Details");
  const [university, setUniversity] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await getMyUniversity(ownerUid);
      setUniversity(data);

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
    setFlash(name ? `ðŸ‘‹ Thanks ${name}, see you soon!` : "ðŸ‘‹ Thanks for visiting â€” see you soon!");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">

      <aside className="w-64 bg-[#1e293b] text-white flex flex-col">
        <div className="flex items-center gap-2.5 px-6 pt-4 pb-3 border-b border-slate-700">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
            <img src={logo} alt="Uni Finder logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-white font-bold text-xl leading-none">
            Uni<span className="text-orange-500">Finder</span>
          </span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={`w-full text-left px-3 py-2 rounded-lg font-medium transition ${
                active === t
                  ? "bg-[#c88410]/20 text-[#f3c277]"
                  : "text-gray-300 hover:bg-white/5"
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
          <h1 className="text-2xl font-bold text-gray-800">
            {university?.name || "Your University"}
          </h1>
          <p className="text-gray-500 text-sm">{adminEmail}</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-3xl space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
            <Skeleton className="h-12 w-40" />
          </div>
        ) : active === "Details" ? (
          <DetailsTab ownerUid={ownerUid} initial={university} onSaved={load} />
        ) : active === "Profile" ? (
          <ProfileTab uid={ownerUid} />
        ) : !university ? (
          <Placeholder note="Save your University Details first to unlock this section." />
        ) : active === "Images" ? (
          <ImagesTab universityId={university.id} />
        ) : active === "Programs" ? (
          <ProgramsTab universityId={university.id} />
        ) : active === "Campuses" ? (
          <CampusRequestsTab ownerUid={ownerUid} />
        ) : (
          <Placeholder note={`ðŸš§ ${active} section coming in the next step.`} />
        )}
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
