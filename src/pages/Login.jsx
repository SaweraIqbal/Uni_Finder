import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import loginImg from "../assets/login.png";
import emailIcon from "../assets/email.png";
import passwordIcon from "../assets/password.png";
import logo from "../assets/Logo.png";
import google from "../assets/google.png";
import facebook from "../assets/facebook.png";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
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

      // console.log("STATUS:", res.status);

      // const text = await res.text();
      // console.log("RAW RESPONSE:", text);

      // const data = JSON.parse(text);
      // console.log("DATA:", res.data);
      const data = await res.json();

      if (res.ok) {
        await login({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          username: data.user.username,
          role: data.user.role,
        });

        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        console.log("userId saved:", data.user.id);
        console.log("Token:", data.token);

        const role = data.user.role;

        if (role === "admin") {
          navigate("/admin/dashboard", {
            replace: true,
            state: { message: "Login Successful" },
          });
        } else if (role === "student") {
          navigate("/homepage", {
            replace: true,
            state: { message: "Login Successful" },
          });
        } else if (role === "university") {
          navigate("/university/dashboard", {
            replace: true,
            state: { message: "Login Successful" },
          });
        } else if (role === "hostel") {
          navigate("/hostel/dashboard", {
            replace: true,
            state: { message: "Login Successful" },
          });
        } else {
          navigate(
            "/homepage",
            {
              replace: true,
              state: { message: "Login Successful" },
            },
            500,
          );
        }
      } else {
        toast.error(data.message || "Invalid email or password");
      }
    } catch (error) {
      console.log("Error:", error);
      toast.error("Server error ");
    } finally {
      setLoading(false); // ← STOP loading
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-screen flex justify-center items-center font-['Poppins',sans-serif]">
      <div className="relative flex w-[1000px] min-h-[600px] max-w-[90%] bg-white rounded-[40px] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.1)]">
        <div className="relative w-1/2 px-[60px] py-[60px] flex flex-col justify-center z-[12] bg-gradient-to-r from-white via-white/90 to-transparent">
          <ToastContainer position="top-right" autoClose={2000} />

          <div className="flex items-center justify-center gap-[10px] mb-6 ml-[140px]">
            <img src={logo} alt="Uni Finder Logo" className="w-[35px]" />
            <h2 className="text-2xl font-medium text-[#333]">
              Uni <span className="text-orange-500">Finder</span>
            </h2>
          </div>

          <h1 className="text-[30px] font-bold text-black text-center -mt-5 mb-[1px]">
            Welcome Back
          </h1>

          <p className="text-center text-[20px] text-[#555] mb-6">
            Log in to your account to{" "}
            <span className="text-orange-500 font-semibold">Continue</span>
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <div
                className={`flex items-center border-2 ${errors.email ? "border-red-500" : "border-black"} rounded-[20px] px-5 py-3`}
              >
                <img src={emailIcon} alt="Email" className="w-6 h-6" />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="border-none outline-none w-full text-[18px] ml-[15px] bg-transparent"
                />
              </div>

              {errors.email && (
                <p className="text-red-500 text-sm ml-3 mt-1">{errors.email}</p>
              )}
            </div>

            <div className="mb-3">
              <div
                className={`flex items-center border-2 ${errors.password ? "border-red-500" : "border-black"} rounded-[20px] px-5 py-3`}
              >
                <img src={passwordIcon} alt="Password" className="w-6 h-6" />

                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="•••••••••"
                  className="border-none outline-none w-full text-[18px] ml-[15px] bg-transparent"
                />
              </div>

              {errors.password && (
                <p className="text-red-500 text-sm ml-3 mt-1">
                  {errors.password}
                </p>
              )}
            </div>

            <a
              href="#"
              className="text-orange-500 no-underline text-[18px] font-medium text-right block mb-[10px] hover:text-orange-600 hover:underline"
            >
              Forgot Password?
            </a>

            <button
              type="submit"
              className="w-full py-[15px] border-none rounded-[20px]  bg-orange-500 text-white text-[22px] font-semibold cursor-pointer transition-all duration-300 mb-[15px] hover:bg-orange-600 hover:-translate-y-[2px]"
            >
              Log In
            </button>
          </form>

          <p className="text-center text-[16px]">
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/Signup")}
              className="text-orange-500 font-bold cursor-pointer hover:underline"
            >
              Sign Up
            </span>
          </p>

          <div className="flex items-center my-5">
            <div className="flex-1 h-[2px] bg-black" />

            <p className="mx-[15px] text-[18px] font-medium">
              Or <span className="font-bold text-orange-500">log in</span> with
            </p>

            <div className="flex-1 h-[2px] bg-black" />
          </div>

          <div className="flex gap-[15px] justify-center mt-[15px]">
            <button className="flex items-center justify-center gap-[10px] w-[160px] px-[15px] py-[10px] rounded-[20px] border-2 border-black bg-white text-[16px] font-medium cursor-pointer transition-all duration-300 hover:bg-[#f5f5f5] hover:-translate-y-[2px] hover:border-[#c88410]">
              <img src={google} alt="Google" className="w-[22px] h-[22px]" />
              Google
            </button>

            <button className="flex items-center justify-center gap-[10px] w-[160px] px-[15px] py-[10px] rounded-[20px] border-2 border-black bg-white text-[16px] font-medium cursor-pointer transition-all duration-300 hover:bg-[#f5f5f5] hover:-translate-y-[2px] hover:border-[#c88410]">
              <img
                src={facebook}
                alt="Facebook"
                className="w-[22px] h-[22px]"
              />
              Facebook
            </button>
          </div>
        </div>

        <div className="relative w-1/2 flex items-center justify-end bg-white">
          <img
            src={loginImg}
            alt="Login Illustration"
            className="absolute right-[-400px] bottom-5 w-[200%] max-w-none h-auto object-contain opacity-90 pointer-events-none top-[60%] -translate-y-1/2"
          />
        </div>
      </div>
    </div>
  );
}

export default Login;
