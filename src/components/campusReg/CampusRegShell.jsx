/**
 * CampusRegShell.jsx
 * Pre-dashboard shell: white topbar + welcome block.
 * Wraps both /campus/register and /campus/registration-status.
 * Dev switcher removed — status now comes from the real API.
 */
import { useNavigate } from "react-router-dom";
import Logo from "../../assets/Logo.png";
import { setFlash } from "../../utils/flash";

export default function CampusRegShell({ children }) {
  const navigate = useNavigate();

  const user     = JSON.parse(sessionStorage.getItem("user") || "{}");
  const email    = user.email      || "";
  const assigned = user.assigned_id || "";

  const handleLogout = () => {
    const name = (user.name || "").split(" ")[0];
    sessionStorage.clear();
    setFlash(name ? `👋 Thanks ${name}, see you soon!` : "👋 Thanks for visiting — see you soon!");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6 shrink-0 z-20">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
            <img src={Logo} alt="UniFinder" className="w-full h-full object-contain" />
          </div>
          <div className="leading-tight">
            <span className="font-bold text-lg">
              <span className="text-orange-500">Uni</span>
              <span className="text-slate-900">Finder</span>
            </span>
            <span className="text-sm text-slate-400 ml-2 font-normal">Campus Panel</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="text-sm px-4 py-2 rounded-lg border border-gray-200 bg-white text-slate-700
                     hover:bg-gray-50 active:scale-[0.98] transition-all duration-150
                     focus:outline-none focus:ring-2 focus:ring-orange-300"
        >
          Logout
        </button>
      </header>

      {/* ── Page content ────────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-[760px] mx-auto px-6 py-8">
        {/* Welcome block */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-800 mb-2">
            Welcome{email ? ", " : ""}
            <span className="text-slate-600">{email}</span>
          </h1>
          {assigned && (
            <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200
                             text-amber-700 text-xs font-medium px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              Your ID: {assigned}
            </span>
          )}
        </div>

        {children}
      </main>
    </div>
  );
}
