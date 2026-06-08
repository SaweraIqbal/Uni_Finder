import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/Logo.png";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const dropdownRef = useRef(null);
  const signupRef = useRef(null);

  // Close dropdowns on outside click
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

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img src={logo} alt="logo" className="h-8 w-8" />
          <h1 className="text-xl font-bold text-orange-500">UniFinder</h1>
        </div>

        {/* Right side */}
        {user ? (
          /* ── LOGGED IN ── */
          <div className="flex items-center gap-4" ref={dropdownRef}>
            <span className="text-sm text-gray-600 hidden sm:block">
              {console.log("User info in Navbar:", user)}
              Hi, {user.name}
            </span>

            {/* Profile avatar + dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-orange-500 hover:scale-105 transition focus:outline-none"
              >
                <img
                  src={user.avatar || "https://i.pravatar.cc/100"}
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
                      logout();
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
          /* ── NOT LOGGED IN ── */
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-50 transition"
            >
              Log In
            </button>

            {/* Sign Up with role dropdown */}
            <div className="relative" ref={signupRef}>
              <button
                onClick={() => setSignupOpen((prev) => !prev)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
              >
                Sign Up
                <span
                  className={`text-xs transition-transform duration-200 ${signupOpen ? "rotate-180" : ""}`}
                >
                  ▾
                </span>
              </button>

              {signupOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
                  <p className="text-xs text-gray-400 px-4 pt-3 pb-1 uppercase tracking-wider">
                    I am a...
                  </p>

                  <button
                    onClick={() => navigate("/signup/student")}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-orange-50 hover:text-orange-500 transition text-left"
                  >
                    <span className="text-lg">🎓</span>
                    <span>
                      <p className="text-sm font-medium">Student</p>
                      <p className="text-xs text-gray-400">
                        Find universities & hostels
                      </p>
                    </span>
                  </button>

                  <hr className="border-gray-100" />

                  <button
                    onClick={() => navigate("/signup/university")}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-orange-50 hover:text-orange-500 transition text-left"
                  >
                    <span className="text-lg">🏫</span>
                    <span>
                      <p className="text-sm font-medium">University</p>
                      <p className="text-xs text-gray-400">
                        Register your university
                      </p>
                    </span>
                  </button>

                  <hr className="border-gray-100" />

                  <button
                    onClick={() => navigate("/signup/hostel")}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-orange-50 hover:text-orange-500 transition text-left"
                  >
                    <span className="text-lg">🏠</span>
                    <span>
                      <p className="text-sm font-medium">Hostel Owner</p>
                      <p className="text-xs text-gray-400">List your hostel</p>
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
