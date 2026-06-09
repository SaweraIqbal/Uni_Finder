import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import signupImg from "../assets/signup.png";
import logo from "../assets/Logo.png";
import nameIcon from "../assets/name.png";
import usernameIcon from "../assets/username.png";
import emailIcon from "../assets/email.png";
import lockIcon from "../assets/password.png";
import googleIcon from "../assets/google.png";
import facebookIcon from "../assets/facebook.png";

function Signup() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { role } = useParams();
  // /signup/student  → role = "student"
  // /signup/university → role = "university"
  // /signup/hostel → role = "hostel"

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

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

    const allowedRoles = ["student", "university", "hostel", "admin"];

    if (!role || !allowedRoles.includes(role)) {
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
        toast.success(data.message || "Signup successful");

        // 🔥 IMPORTANT FIX: use backend role if available
        const userRole = data.user?.role || role;

        // Persist user so ProtectedRoute + dashboards work right after signup
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
            })
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
    <div className="fixed top-0 left-0 w-full h-screen flex justify-center items-center font-['Poppins',sans-serif] bg-gray-100 p-4">
      <div className="relative flex w-[1000px] h-[650px] max-h-[90vh] bg-white rounded-[40px] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.1)]">
        <ToastContainer position="top-right" autoClose={2000} />

        <div className="relative w-1/2 hidden md:flex items-center bg-white overflow-hidden">
          <img
            src={signupImg}
            alt="Signup Illustration"
            className="absolute left-[70px] w-[180%] max-w-none h-auto object-contain opacity-90 pointer-events-none top-1/2 -translate-y-1/2 z-10"
          />
        </div>

        <div className="relative w-full md:w-1/2 flex flex-col bg-white z-[20]">
          <div className="flex-1 overflow-y-auto px-[50px] py-[40px] scrollbar-thin scrollbar-thumb-[#c88410]">
            <div className="flex items-center gap-[10px] mb-4">
              <img src={logo} alt="Logo" className="w-[30px]" />
              <h2 className="text-xl font-medium text-[#333]">
                Uni <span className="text-orange-500 font-bold">Finder</span>
              </h2>
            </div>

            <h1 className="text-[28px] font-bold text-black mb-1">
              Join <span className="text-orange-500">Uni Finder</span>
            </h1>
            <p className="text-[16px] text-[#555] mb-6">
              Create an account to access{" "}
              <span className="text-orange-500 font-semibold">
                top university
              </span>{" "}
              information
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col">
                <div
                  className={`flex items-center border-2 ${errors.fullName ? "border-red-500" : "border-black"} rounded-[20px] px-4 py-3`}
                >
                  <img src={nameIcon} alt="" className="w-5 h-5" />
                  <input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    type="text"
                    placeholder="Full Name"
                    className="border-none outline-none w-full text-[16px] ml-3 bg-transparent"
                  />
                </div>
                {errors.fullName && (
                  <span className="text-red-500 text-[12px] ml-4 mt-1">
                    {errors.fullName}
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <div
                  className={`flex items-center border-2 ${errors.username ? "border-red-500" : "border-black"} rounded-[20px] px-4 py-3`}
                >
                  <img src={usernameIcon} alt="" className="w-5 h-5" />
                  <input
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    type="text"
                    placeholder="Username"
                    className="border-none outline-none w-full text-[16px] ml-3 bg-transparent"
                  />
                </div>
                {errors.username && (
                  <span className="text-red-500 text-[12px] ml-4 mt-1">
                    {errors.username}
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <div
                  className={`flex items-center border-2 ${errors.email ? "border-red-500" : "border-black"} rounded-[20px] px-4 py-3`}
                >
                  <img src={emailIcon} alt="" className="w-5 h-5" />
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    type="email"
                    placeholder="Email"
                    className="border-none outline-none w-full text-[16px] ml-3 bg-transparent"
                  />
                </div>
                {errors.email && (
                  <span className="text-red-500 text-[12px] ml-4 mt-1">
                    {errors.email}
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <div
                  className={`flex items-center border-2 ${errors.password ? "border-red-500" : "border-black"} rounded-[20px] px-4 py-3 relative`}
                >
                  <img src={lockIcon} alt="" className="w-5 h-5" />
                  <input
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    type={showPass ? "text" : "password"}
                    placeholder="Password"
                    className="border-none outline-none w-full text-[16px] ml-3 bg-transparent"
                  />
                  <span
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-5 text-[10px] font-bold text-orange-500 cursor-pointer hover:text-[#a66d0d]"
                  >
                    {showPass ? "HIDE" : "SHOW"}
                  </span>
                </div>
                {errors.password && (
                  <span className="text-red-500 text-[12px] ml-4 mt-1">
                    {errors.password}
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <div
                  className={`flex items-center border-2 ${errors.confirmPassword ? "border-red-500" : "border-black"} rounded-[20px] px-4 py-3 relative`}
                >
                  <img src={lockIcon} alt="" className="w-5 h-5" />
                  <input
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm Password"
                    className="border-none outline-none w-full text-[16px] ml-3 bg-transparent"
                  />
                  <span
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-5 text-[10px] font-bold text-orange-500 cursor-pointer hover:text-[#a66d0d]"
                  >
                    {showConfirm ? "HIDE" : "SHOW"}
                  </span>
                </div>
                {errors.confirmPassword && (
                  <span className="text-red-500 text-[12px] ml-4 mt-1">
                    {errors.confirmPassword}
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-4 mt-2 border-none rounded-[20px] bg-orange-500 text-white text-[18px] font-semibold cursor-pointer transition-all duration-300 hover:bg-orange-600 hover:-translate-y-[2px] shadow-lg"
              >
                Create Account
              </button>
            </form>

            <p className="text-center text-[15px] mt-4">
              Already have an account?{" "}
              <span
                onClick={() => navigate("/login")}
                className="text-orange-500 font-bold cursor-pointer hover:underline"
              >
                Log In
              </span>
            </p>

            <div className="flex items-center my-6">
              <div className="flex-1 h-[1.5px] bg-black" />
              <p className="mx-4 text-[14px] font-medium">
                Or <span className="font-bold text-orange-500">sign up</span>{" "}
                with
              </p>
              <div className="flex-1 h-[1.5px] bg-black" />
            </div>

            <div className="flex gap-4 justify-center pb-6">
              <button
                type="button"
                className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-[20px] border-2 border-black bg-white text-[14px] font-medium transition-all hover:bg-gray-50 hover:border-[#c88410] hover:-translate-y-1"
              >
                <img src={googleIcon} alt="Google" className="w-5 h-5" /> Google
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-[20px] border-2 border-black bg-white text-[14px] font-medium transition-all hover:bg-gray-50 hover:border-[#c88410] hover:-translate-y-1"
              >
                <img src={facebookIcon} alt="Facebook" className="w-5 h-5" />{" "}
                Facebook
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
