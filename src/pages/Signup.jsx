import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import logo from "../assets/Logo.png";
import nameIcon from "../assets/name.png";
import usernameIcon from "../assets/username.png";
import emailIcon from "../assets/email.png";
import lockIcon from "../assets/password.png";
import googleIcon from "../assets/google.png";
// import facebookIcon from "../assets/facebook.png";
import { setFlash } from "../utils/flash";

// ── Role picker — shown when /signup is visited without a role segment ────────
const ROLE_OPTIONS = [
  {
    role: "student",
    emoji: "🎓",
    label: "Student",
    sub: "Search universities, compare programs & find hostels",
    accent: "from-orange-400 to-amber-400",
  },
  {
    role: "university",
    emoji: "🏫",
    label: "University",
    sub: "Register & manage your university profile",
    accent: "from-sky-400 to-blue-500",
  },
  {
    role: "campus",
    emoji: "🏛️",
    label: "Campus",
    sub: "Register and manage a university campus",
    accent: "from-violet-400 to-purple-500",
  },
  {
    role: "hostel",
    emoji: "🏠",
    label: "Hostel Owner",
    sub: "List and manage your hostel for students",
    accent: "from-emerald-400 to-green-500",
  },
];

function RolePicker() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);

  return (
    <div className="fixed top-0 left-0 w-full h-screen flex justify-center items-center bg-gray-100 p-4">
      <div className="relative flex w-[1000px] min-h-[560px] max-w-[95%] max-h-[94vh] bg-white rounded-[40px] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.15)]">

        {/* Left image panel */}
        <div className="relative w-1/2 hidden md:block overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80"
            alt="University students"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30" />
          {/* Overlay text on the image */}
          <div className="absolute inset-0 flex flex-col justify-end p-10">
            <h2 className="text-3xl font-bold text-white drop-shadow-md leading-snug">
              Pakistan's smartest<br />university platform
            </h2>
            <p className="text-white/80 text-sm mt-2 drop-shadow">
              Compare, explore & connect — all in one place.
            </p>
          </div>
        </div>

        {/* Right panel */}
        <div className="relative w-full md:w-1/2 flex flex-col bg-white z-[20]">
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-8 sm:px-8 md:px-[50px] md:py-[40px] [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">

            {/* Logo */}
            <div className="flex items-center gap-2 mb-5">
              <img src={logo} alt="Logo" className="w-8" />
              <h2 className="text-xl font-semibold text-gray-700">
                Uni <span className="text-orange-500">Finder</span>
              </h2>
            </div>

            {/* Heading */}
            <h1 className="text-2xl md:text-[26px] font-bold text-gray-800 mb-1">
              Create Account
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              Who are you signing up as?
            </p>

            {/* Role cards */}
            <div className="space-y-3">
              {ROLE_OPTIONS.map(({ role, emoji, label, sub, accent }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => navigate(`/signup/${role}`)}
                  onMouseEnter={() => setHovered(role)}
                  onMouseLeave={() => setHovered(null)}
                  className={`
                    w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 text-left
                    transition-all duration-200 cursor-pointer
                    ${hovered === role
                      ? "border-orange-400 bg-orange-50 -translate-y-[1px] shadow-md"
                      : "border-gray-200 bg-white hover:border-orange-200"
                    }
                  `}
                >
                  {/* Emoji badge */}
                  <span
                    className={`
                      w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0
                      bg-gradient-to-br ${accent} shadow-sm
                    `}
                  >
                    {emoji}
                  </span>

                  {/* Text */}
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-gray-800">
                      {label}
                    </span>
                    <span className="block text-xs text-gray-400 mt-0.5 leading-snug">
                      {sub}
                    </span>
                  </span>

                  {/* Arrow */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-4 h-4 flex-shrink-0 transition-colors duration-200 ${
                      hovered === role ? "text-orange-500" : "text-gray-300"
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              ))}
            </div>

            {/* Login link */}
            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{" "}
              <span
                onClick={() => navigate("/login")}
                className="text-orange-500 font-semibold cursor-pointer hover:underline"
              >
                Log In
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Signup() {
  const navigate = useNavigate();
  const { role } = useParams();

  // ALL hooks must be declared before any conditional return
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  const allowedRoles = ["student", "university", "hostel", "campus"];
  const roleIsValid = role && allowedRoles.includes(role);

  // If no valid role in URL, render the picker (all hooks already called above)
  if (!roleIsValid) {
    return <RolePicker />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validate = () => {
    let newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.fullName.trim()) newErrors.fullName = "Name is required";
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    // role is already validated above (roleIsValid guard), this is a safety net
    if (!roleIsValid) {
      toast.error("Invalid role in URL");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.fullName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: role,
        }),
      });

      const data = await res.json();

      console.log("ROLE SENT:", role);
      console.log("BACKEND RESPONSE:", data);

      if (res.ok) {
        setFlash(data.message || "Signup successful");
        if (data.token) sessionStorage.setItem("token", data.token);

        const userRole = data.user?.role || role;

        if (data.user?.id) {
          sessionStorage.setItem("userId", data.user.id);
          sessionStorage.setItem(
            "user",
            JSON.stringify({
              id: data.user.id,
              email: formData.email,
              name: formData.fullName,
              username: formData.username,
              role: userRole,
            }),
          );
        }

        setTimeout(() => {
          switch (userRole) {
            case "student":
              navigate("/homepage", { replace: true });
              break;

            case "university":
              navigate("/university/dashboard", { replace: true });
              break;

            case "campus":
              navigate("/campus/dashboard", { replace: true });
              break;

            case "hostel":
              navigate("/hostel/dashboard", { replace: true });
              break;

            case "admin":
              navigate("/admin/dashboard", { replace: true });
              break;

            default:
              toast.error("Invalid role detected");
              navigate("/login", { replace: true });
          }
        }, 500);
      } else {
        toast.error(data.message || "Signup failed");
      }
    } catch (error) {
      console.log(error);
      toast.error("Server error");
    }
  };
  return (
    <div className="fixed top-0 left-0 w-full h-screen flex justify-center items-center bg-gray-100 p-4 ">
      <div className="relative flex w-[1000px] min-h-[560px] max-w-[95%] max-h-[94vh] bg-white rounded-[40px] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.15)]">
        {/* Left Image - Hidden on Mobile */}
        <div className="relative w-1/2 hidden md:block overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80"
            alt="Smiling university students"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30" />
        </div>

        {/* Right Form Panel */}
        <div className="relative w-full md:w-1/2 flex flex-col bg-white z-[20]">
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-8 sm:px-8 sm:py-8 md:px-[50px] md:py-[40px] [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-3">
              <img src={logo} alt="Logo" className="w-8" />
              <h2 className="text-xl font-semibold text-gray-700">
                Uni <span className="text-orange-500">Finder</span>
              </h2>
            </div>

            {/* Heading */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
              Create Account
            </h1>
            <p className="text-gray-500 mb-7">
              Sign up to access{" "}
              <span className="text-orange-500 font-semibold">
                top university
              </span>{" "}
              information
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <div
                  className={`flex items-center gap-3 border-2 rounded-2xl px-4 py-3 transition-colors ${
                    errors.fullName
                      ? "border-red-400"
                      : "border-gray-200 focus-within:border-orange-500"
                  }`}
                >
                  <img src={nameIcon} alt="" className="w-5 h-5 opacity-70" />
                  <input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    type="text"
                    placeholder="Full Name"
                    className="border-none outline-none w-full text-[15px] bg-transparent"
                  />
                </div>
                {errors.fullName && (
                  <p className="text-red-500 text-xs ml-2 mt-1">
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Username */}
              <div>
                <div
                  className={`flex items-center gap-3 border-2 rounded-2xl px-4 py-3 transition-colors ${
                    errors.username
                      ? "border-red-400"
                      : "border-gray-200 focus-within:border-orange-500"
                  }`}
                >
                  <img
                    src={usernameIcon}
                    alt=""
                    className="w-5 h-5 opacity-70"
                  />
                  <input
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    type="text"
                    placeholder="Username"
                    className="border-none outline-none w-full text-[15px] bg-transparent"
                  />
                </div>
                {errors.username && (
                  <p className="text-red-500 text-xs ml-2 mt-1">
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <div
                  className={`flex items-center gap-3 border-2 rounded-2xl px-4 py-3 transition-colors ${
                    errors.email
                      ? "border-red-400"
                      : "border-gray-200 focus-within:border-orange-500"
                  }`}
                >
                  <img src={emailIcon} alt="" className="w-5 h-5 opacity-70" />
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    type="email"
                    placeholder="Email address"
                    className="border-none outline-none w-full text-[15px] bg-transparent"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs ml-2 mt-1">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div
                  className={`flex items-center gap-3 border-2 rounded-2xl px-4 py-3 transition-colors ${
                    errors.password
                      ? "border-red-400"
                      : "border-gray-200 focus-within:border-orange-500"
                  }`}
                >
                  <img src={lockIcon} alt="" className="w-5 h-5 opacity-70" />
                  <input
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    type={showPass ? "text" : "password"}
                    placeholder="Password"
                    className="border-none outline-none w-full text-[15px] bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="text-[11px] font-bold text-orange-500 hover:text-orange-600"
                  >
                    {showPass ? "HIDE" : "SHOW"}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs ml-2 mt-1">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <div
                  className={`flex items-center gap-3 border-2 rounded-2xl px-4 py-3 transition-colors ${
                    errors.confirmPassword
                      ? "border-red-400"
                      : "border-gray-200 focus-within:border-orange-500"
                  }`}
                >
                  <img src={lockIcon} alt="" className="w-5 h-5 opacity-70" />
                  <input
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm Password"
                    className="border-none outline-none w-full text-[15px] bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="text-[11px] font-bold text-orange-500 hover:text-orange-600"
                  >
                    {showConfirm ? "HIDE" : "SHOW"}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs ml-2 mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-orange-500 text-white text-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-orange-600 hover:-translate-y-[1px] shadow-lg"
              >
                Create Account
              </button>
            </form>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-500 mt-5">
              Already have an account?{" "}
              <span
                onClick={() => navigate("/login")}
                className="text-orange-500 font-semibold cursor-pointer hover:underline"
              >
                Log In
              </span>
            </p>

            {/* Divider */}
            <div className="flex items-center my-5">
              <div className="flex-1 h-px bg-gray-200" />
              <p className="mx-4 text-xs text-gray-400 font-medium">
                Or{" "}
                <span className="font-semibold text-orange-500">sign up</span>{" "}
                with
              </p>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Social Buttons */}
            <div className="flex gap-3 justify-center pb-1">
              <button
                type="button"
                className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium cursor-pointer transition-all hover:bg-gray-50 hover:border-orange-400 hover:-translate-y-[1px]"
              >
                <img src={googleIcon} alt="Google" className="w-5 h-5" />
                Google
              </button>
              {/* <button
                type="button"
                className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium cursor-pointer transition-all hover:bg-gray-50 hover:border-orange-400 hover:-translate-y-[1px]"
              >
                <img src={facebookIcon} alt="Facebook" className="w-5 h-5" />
                Facebook
              </button> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
