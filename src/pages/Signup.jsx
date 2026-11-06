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
import { resendVerificationEmail, signup as signupApi } from "../api/client";

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
    label: "Independent Hostel",
    sub: "List and manage your own hostel for students",
    accent: "from-emerald-400 to-green-500",
  },
  {
    role: "campus_hostel",
    emoji: "🏘️",
    label: "Campus Hostel",
    sub: "Register a hostel affiliated with a university campus",
    accent: "from-teal-400 to-cyan-500",
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
  const [pendingEmail, setPendingEmail] = useState("");
  const [deliveryFailed, setDeliveryFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const allowedRoles = ["student", "university", "hostel", "campus", "campus_hostel"];
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
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
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

    setIsSubmitting(true);
    try {
      const { ok, status, data } = await signupApi({
        name: formData.fullName,
        username: formData.username,
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role,
      });

      if (data.verificationRequired) {
        setPendingEmail(data.email || formData.email.trim().toLowerCase());
        setDeliveryFailed(Boolean(data.emailDeliveryFailed));
        return;
      }

      if (ok) {
        setFlash(data.message || "Signup successful");
        navigate("/login", { replace: true });
      } else {
        // Handle specific error cases
        if (status === 409) {
          setErrors({ email: data.message || "An account with this email already exists" });
        } else if (data.message && data.message.toLowerCase().includes("email")) {
          setErrors({ email: data.message });
        } else if (data.message && data.message.toLowerCase().includes("password")) {
          setErrors({ password: data.message });
        } else {
          toast.error(data.message || "Signup failed");
        }
      }
    } catch (error) {
      toast.error(error.message || "Could not reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    setResendMessage("");
    try {
      const { status, data } = await resendVerificationEmail(pendingEmail);
      setResendMessage(data.message || "If an unverified account exists, a verification email will be sent.");
      if (status === 429) setDeliveryFailed(true);
      else if (status >= 500) setDeliveryFailed(true);
      else setDeliveryFailed(false);
    } catch (error) {
      setResendMessage(error.message || "Could not reach the server. Please try again.");
      setDeliveryFailed(true);
    } finally {
      setIsResending(false);
    }
  };

  if (pendingEmail) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-100 p-4">
        <section className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl">
          <img src={logo} alt="Uni Finder" className="mx-auto mb-5 w-12" />
          <h1 className="text-2xl font-bold text-gray-800">
            {deliveryFailed ? "Account created — email pending" : "Check your email"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            {deliveryFailed
              ? "Your account is not active yet. We could not deliver the verification email. Check your address and SMTP configuration, then try again."
              : "We sent a verification link to:"}
          </p>
          <p className="mt-2 break-all font-semibold text-orange-600">{pendingEmail}</p>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            Open the link in that mailbox within 24 hours. You can use Gmail or another email provider; verification confirms access to the mailbox, not that it is specifically a Gmail account. Check spam or junk if it does not arrive.
          </p>
          {resendMessage && (
            <p className="mt-4 text-sm text-gray-600" role="status">{resendMessage}</p>
          )}
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={isResending}
            className="mt-6 w-full rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isResending ? "Sending..." : "Resend verification email"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mt-4 text-sm font-semibold text-orange-600 hover:underline"
          >
            Back to login
          </button>
        </section>
      </div>
    );
  }
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
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck="false"
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
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-orange-500 text-white text-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-orange-600 hover:-translate-y-[1px] shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Creating account..." : "Create Account"}
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
