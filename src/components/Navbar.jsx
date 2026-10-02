import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { setFlash } from "../utils/flash";
import logo from "../assets/Logo.png";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const signupRef = useRef(null);

  const isLandingPage = location.pathname === "/";

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
      if (signupRef.current && !signupRef.current.contains(e.target))
        setSignupOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navLinks = [
    { name: "Universities", href: "/#universities" },
    { name: "Hostels", href: "/#hostels" },
    { name: "Features", href: "/#features" },
    { name: "How It Works", href: "/#how-it-works" },
    { name: "How To Compare", href: "/#compare" },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center gap-3 min-w-0">
        {/* Logo */}
        <div
          className="flex items-center gap-1 cursor-pointer shrink-0"
          onClick={() => navigate("/")}
        >          <img
            src={logo}
            alt="UniFinder logo"
            className="h-8 w-8 sm:h-9 sm:w-9 object-contain flex-shrink-0"
          />
          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight leading-none">
            <span className="text-slate-800">Uni </span>
            <span className="text-orange-500">Finder</span>
          </h1>
        </div>

        {/* Desktop Nav Links (Only on landing page, lg+) */}
        {isLandingPage && (
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm text-gray-600 hover:text-orange-500 transition-colors duration-300 whitespace-nowrap"
              >
                {link.name}
              </a>
            ))}
          </nav>
        )}

        {/* Right side: auth + mobile hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            /* LOGGED IN */
            <div className="flex items-center gap-3" ref={dropdownRef}>
              <span className="text-sm text-gray-600 hidden sm:block">
                Hi, {user.name}
              </span>
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="w-9 h-9 rounded-full overflow-hidden border-2 border-orange-500 hover:scale-105 transition focus:outline-none"
                >
                  <img
                    src={
                      user.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        user.name || "User",
                      )}&background=f97316&color=fff`
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
                    <button
                      onClick={() => {
                        navigate("/profile");
                        setDropdownOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-orange-50 hover:text-orange-500 transition text-left text-sm"
                    >
                      👤 My Profile
                    </button>
                    <hr className="border-gray-100" />
                    <button
                      onClick={() => {
                        const name = (user?.name || "").split(" ")[0];
                        logout();
                        setFlash(
                          name
                            ? `👋 Thanks ${name}, see you soon!`
                            : "👋 Thanks for visiting — see you soon!",
                        );
                        navigate("/");
                        setDropdownOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-red-50 hover:text-red-500 transition text-left text-sm"
                    >
                      🚪 Log Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* LOGGED OUT — desktop auth buttons */
            <div className="hidden sm:flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => navigate("/login")}
                className="px-3 sm:px-4 py-2 border border-orange-500 text-orange-500 text-sm rounded-lg hover:bg-orange-50 transition"
              >
                Log In
              </button>
              <div className="relative" ref={signupRef}>
                <button
                  onClick={() => setSignupOpen((prev) => !prev)}
                  className="px-3 sm:px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition flex items-center gap-1.5"
                >
                  Sign Up
                  <span
                    className={`text-xs transition-transform duration-200 ${
                      signupOpen ? "rotate-180" : ""
                    }`}
                  >
                    ▾
                  </span>
                </button>

                {signupOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
                    <p className="text-xs text-gray-400 px-4 pt-3 pb-1 uppercase tracking-wider">
                      I am a...
                    </p>
                    {[
                      { emoji: "🎓", label: "Student", sub: "Find universities & hostels", path: "/signup/student" },
                      { emoji: "🏫", label: "University", sub: "Register your university", path: "/signup/university" },
                      { emoji: "🏛️", label: "Campus", sub: "Register a university campus", path: "/signup/campus" },
                      { emoji: "🏠", label: "Hostel Owner", sub: "List your hostel", path: "/signup/hostel" },
                    ].map(({ emoji, label, sub, path }, i, arr) => (
                      <div key={path}>
                        <button
                          onClick={() => navigate(path)}
                          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-orange-50 hover:text-orange-500 transition text-left"
                        >
                          <span className="text-lg">{emoji}</span>
                          <span>
                            <p className="text-sm font-medium">{label}</p>
                            <p className="text-xs text-gray-400">{sub}</p>
                          </span>
                        </button>
                        {i < arr.length - 1 && <hr className="border-gray-100" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hamburger — visible on mobile (< sm) when not logged in, or always for nav links on < lg */}
          {(isLandingPage || !user) && (
            <button
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="lg:hidden flex flex-col gap-1.5 p-1.5 rounded-md hover:bg-gray-100 transition"
              aria-label="Toggle menu"
            >
              <span className={`block w-5 h-0.5 bg-gray-600 transition-transform ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block w-5 h-0.5 bg-gray-600 transition-opacity ${mobileMenuOpen ? "opacity-0" : ""}`} />
              <span className={`block w-5 h-0.5 bg-gray-600 transition-transform ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-1 shadow-md">
          {/* Nav links (only landing page) */}
          {isLandingPage && navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-3 text-sm text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition"
            >
              {link.name}
            </a>
          ))}

          {/* Auth buttons for logged-out users on mobile */}
          {!user && (
            <div className="pt-3 border-t border-gray-100 space-y-2 sm:hidden">
              <button
                onClick={() => { navigate("/login"); setMobileMenuOpen(false); }}
                className="w-full py-2.5 border border-orange-500 text-orange-500 text-sm rounded-lg hover:bg-orange-50 transition"
              >
                Log In
              </button>
              <p className="text-xs text-gray-400 px-1 pt-1 uppercase tracking-wider">Sign Up as...</p>
              {[
                { emoji: "🎓", label: "Student", path: "/signup/student" },
                { emoji: "🏫", label: "University", path: "/signup/university" },
                { emoji: "🏛️", label: "Campus", path: "/signup/campus" },
                { emoji: "🏠", label: "Hostel Owner", path: "/signup/hostel" },
              ].map(({ emoji, label, path }) => (
                <button
                  key={path}
                  onClick={() => { navigate(path); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-2 py-2.5 px-3 text-sm text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition text-left"
                >
                  <span>{emoji}</span> {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
