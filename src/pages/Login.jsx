import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import emailIcon from "../assets/email.png";
import passwordIcon from "../assets/password.png";
import logo from "../assets/Logo.png";
import google from "../assets/google.png";
import facebook from "../assets/facebook.png";
import { useAuth } from "../context/AuthContext";
import { setFlash } from "../utils/flash";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validate = () => {
    let newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid Email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });


      const data = await res.json();

      if (res.ok) {
        await login({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          username: data.user.username,
          role: data.user.role,
        });

        sessionStorage.setItem("userId", data.user.id);
        sessionStorage.setItem("token", data.token);




        setFlash("Login Successful");

        const role = data.user.role;

        if (role === "admin") {
          navigate("/admin/dashboard", { replace: true });
        } else if (role === "student") {
          navigate("/homepage", { replace: true });
        } else if (role === "university") {
          navigate("/university/dashboard", { replace: true });
        } else if (role === "campus") {
          navigate("/campus/dashboard", { replace: true });
        } else if (role === "hostel") {
          navigate("/hostel/dashboard", { replace: true });
        } else {
          navigate("/homepage", { replace: true });
        }
      } else {
        toast.error(data.message || "Invalid email or password");
      }
    } catch (error) {
      console.log("Error:", error);
      toast.error("Server error ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-screen flex justify-center items-center p-4 bg-gray-100 font-['Poppins',sans-serif]">
      <div className="relative flex w-[1000px] min-h-[560px] max-w-[95%] max-h-[94vh] bg-white rounded-[40px] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.15)]">

        <div className="relative w-full md:w-1/2 px-[50px] py-[40px] flex flex-col justify-center overflow-y-auto">

          <div className="flex items-center gap-2 mb-8">
            <img src={logo} alt="Uni Finder Logo" className="w-8" />
            <h2 className="text-xl font-semibold text-gray-700">
              Uni <span className="text-orange-500">Finder</span>
            </h2>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-1">Welcome Back</h1>
          <p className="text-gray-500 mb-7">
            Log in to your account to{" "}
            <span className="text-orange-500 font-semibold">continue</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">

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
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email address"
                  className="border-none outline-none w-full text-[15px] bg-transparent"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs ml-2 mt-1">{errors.email}</p>
              )}
            </div>


            <div>
              <div
                className={`flex items-center gap-3 border-2 rounded-2xl px-4 py-3 transition-colors ${
                  errors.password
                    ? "border-red-400"
                    : "border-gray-200 focus-within:border-orange-500"
                }`}
              >
                <img src={passwordIcon} alt="" className="w-5 h-5 opacity-70" />
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="border-none outline-none w-full text-[15px] bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="text-[11px] font-bold text-orange-500 hover:text-orange-600"
                >
                  {showPass ? "HIDE" : "SHOW"}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs ml-2 mt-1">{errors.password}</p>
              )}
            </div>

            <div className="text-right">
              <a
                href="#"
                className="text-sm text-orange-500 font-medium hover:underline"
              >
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-orange-500 text-white text-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-orange-600 hover:-translate-y-[1px] disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? "Logging in…" : "Log In"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/signup")}
              className="text-orange-500 font-semibold cursor-pointer hover:underline"
            >
              Sign Up
            </span>
          </p>

          <div className="flex items-center my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <p className="mx-4 text-xs text-gray-400 font-medium">
              Or log in with
            </p>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="flex gap-3 justify-center">
            <button className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium cursor-pointer transition-all hover:bg-gray-50 hover:border-orange-400 hover:-translate-y-[1px]">
              <img src={google} alt="Google" className="w-5 h-5" />
              Google
            </button>
            <button className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium cursor-pointer transition-all hover:bg-gray-50 hover:border-orange-400 hover:-translate-y-[1px]">
              <img src={facebook} alt="Facebook" className="w-5 h-5" />
              Facebook
            </button>
          </div>
        </div>


        <div className="relative w-1/2 hidden md:block overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80"
            alt="University students group"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-white/30" />
        </div>

      </div>
    </div>
  );
}

export default Login;
