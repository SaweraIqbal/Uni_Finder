import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/Logo.png";
import { getMyUniversity } from "../../api/university";
import DetailsTab from "./DetailsTab";
import ProfileTab from "./ProfileTab";
import ImagesTab from "./ImagesTab";
import ProgramsTab from "./ProgramsTab";

const TABS = ["Details", "Profile", "Images", "Programs", "Users"];

// Full dashboard for an approved university admin. Loads the university record
// and renders the active tab. Images/Programs/Users come in later steps.
export default function UniversityPanel({ ownerUid, adminEmail }) {
  const navigate = useNavigate();
  const [active, setActive] = useState("Details");
  const [university, setUniversity] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await getMyUniversity(ownerUid);
      setUniversity(data);
      // If details aren't filled yet, keep the user on the Details tab.
      if (!data) setActive("Details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerUid]);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-['Poppins',sans-serif]">
      {/* Sidebar */}
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

      {/* Main */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            {university?.name || "Your University"}
          </h1>
          <p className="text-gray-500 text-sm">{adminEmail}</p>
        </div>

        {loading ? (
          <div className="text-gray-400">Loading…</div>
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
        ) : (
          <Placeholder note={`🚧 ${active} section coming in the next step.`} />
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
