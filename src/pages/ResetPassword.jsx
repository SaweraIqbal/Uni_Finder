import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import logo from "../assets/Logo.png";
import lockIcon from "../assets/password.png";
import { API, resetPassword as resetPasswordApi } from "../api/client";
import { setFlash } from "../utils/flash";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const validate = () => {
    const newErrors = {};
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
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: formData.password }),
      });
      const data = await res.json();
      if (res.ok) {
        setFlash("Password reset successful. Please log in.");
        navigate("/login", { replace: true });
      } else {
        toast.error(data.message || "Reset failed");
      }
    } catch (error) {
      console.log("Error:", error);
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-screen flex justify-center items-center bg-gray-100 p-4">
      <div className="relative flex w-[500px] max-w-[95%] max-h-[94vh] bg-white rounded-[40px] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.15)]">
        <div className="w-full px-8 py-10 flex flex-col justify-center overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <div className="flex items-center gap-2 mb-4">
            <img src={logo} alt="Logo" className="w-8" />
            <h2 className="text-xl font-semibold text-gray-700">
              Uni <span className="text-orange-500">Finder</span>
            </h2>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-1">Set New Password</h1>
          <p className="text-gray-500 text-sm mb-6">
            Enter your new password below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className={`flex items-center gap-3 border-2 rounded-2xl px-4 py-3 transition-colors ${
                errors.password ? "border-red-400" : "border-gray-200 focus-within:border-orange-500"
              }`}>
                <img src={lockIcon} alt="" className="w-5 h-5 opacity-70" />
                <input
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  type={showPass ? "text" : "password"}
                  placeholder="New password (min 8 characters)"
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
              {errors.password && <p className="text-red-500 text-xs ml-2 mt-1">{errors.password}</p>}
            </div>

            <div>
              <div className={`flex items-center gap-3 border-2 rounded-2xl px-4 py-3 transition-colors ${
                errors.confirmPassword ? "border-red-400" : "border-gray-200 focus-within:border-orange-500"
              }`}>
                <img src={lockIcon} alt="" className="w-5 h-5 opacity-70" />
                <input
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm new password"
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
              {errors.confirmPassword && <p className="text-red-500 text-xs ml-2 mt-1">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-orange-500 text-white text-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-orange-600 hover:-translate-y-[1px] shadow-lg disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? "Resetting…" : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
