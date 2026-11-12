import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { API, resendVerificationEmail } from "../../../shared/api/client";
import { useAuth } from "../AuthContext";
import logo from "../../../assets/Logo.png";

const ROLE_HOME = {
  student: "/homepage",
  university: "/university/dashboard",
  campus: "/campus/register",
  admin: "/admin/dashboard",
};

async function resolveNextPage(role, token) {
  if (role === "hostel" || role === "campus_hostel") {
    try {
      const response = await fetch(`${API}/api/hostels/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      const registrations = Array.isArray(data.hostels) ? data.hostels : [];
      if (registrations.some((hostel) => hostel.status === "approved")) {
        return "/hostel/dashboard";
      }
      if (registrations.length) return "/hostel/registration-status";
    } catch {

    }
    return `/hostel/register/${role}`;
  }
  return ROLE_HOME[role] || "/login";
}

function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [state, setState] = useState({
    loading: false,
    success: false,
    complete: false,
    alreadyVerified: false,
    message: "",
    nextPage: "",
  });
  const [email, setEmail] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [resending, setResending] = useState(false);

  const heading = state.loading
    ? "Verifying your email..."
    : state.complete
      ? state.success ? "Email verified" : "Verification failed"
      : "Confirm your email";

  useEffect(() => {
    if (!state.complete || !state.success || state.alreadyVerified || !state.nextPage) {
      return undefined;
    }
    const timer = setTimeout(() => navigate(state.nextPage, { replace: true }), 1400);
    return () => clearTimeout(timer);
  }, [state.complete, state.success, state.alreadyVerified, state.nextPage, navigate]);

  const verify = async () => {
    setState((current) => ({ ...current, loading: true, message: "" }));
    try {
      const response = await fetch(`${API}/api/auth/verify-email/${encodeURIComponent(token)}`, {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok && data.token && data.user) {
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("userId", data.user.id);
        await login(data.user);
        const nextPage = await resolveNextPage(data.user.role, data.token);
        setState({
          loading: false,
          success: true,
          complete: true,
          alreadyVerified: false,
          message: data.message || "Email verified.",
          nextPage,
        });
        return;
      }

      setState({
        loading: false,
        success: response.ok,
        complete: true,
        alreadyVerified: Boolean(data.alreadyVerified),
        message: data.message || "Could not verify this email address.",
        nextPage: "",
      });
    } catch {
      setState({
        loading: false,
        success: false,
        complete: true,
        alreadyVerified: false,
        message: "Could not reach the server. Please try again.",
        nextPage: "",
      });
    }
  };

  const resend = async (event) => {
    event.preventDefault();
    setResending(true);
    setResendMessage("");
    try {
      const { data } = await resendVerificationEmail(email);
      setResendMessage(data.message || "If an unverified account exists, a verification email will be sent.");
    } catch (error) {
      setResendMessage(error.message || "Could not reach the server. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <section className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl">
        <img src={logo} alt="Uni Finder" className="mx-auto mb-5 w-12" />
        <h1 className="text-2xl font-bold text-gray-800">
          {heading}
        </h1>
        {state.complete && <p className="mt-3 text-sm text-gray-600" role="status">{state.message}</p>}
        {!state.complete && !state.loading && (
          <p className="mt-3 text-sm text-gray-600">
            Confirm the address to activate your Uni Finder account.
          </p>
        )}
        {state.loading && <p className="mt-3 text-sm text-gray-600" role="status">Please wait...</p>}
        {!state.complete && !state.loading && (
          <button
            type="button"
            onClick={verify}
            className="mt-6 inline-block rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600"
          >
            Verify email address
          </button>
        )}
        {state.complete && !state.loading && state.success && !state.alreadyVerified && state.nextPage && (
          <>
            <p className="mt-4 text-sm text-gray-500">
              Opening your registration page...
            </p>
            <button
              type="button"
              onClick={() => navigate(state.nextPage, { replace: true })}
              className="mt-3 inline-block rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600"
            >
              Continue now
            </button>
          </>
        )}
        {state.complete && !state.loading && state.alreadyVerified && (
          <Link to="/login" className="mt-6 inline-block rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600">
            Continue to login
          </Link>
        )}
        {state.complete && !state.loading && !state.success && (
          <form onSubmit={resend} className="mt-6 space-y-3">
            <label htmlFor="resend-email" className="block text-left text-sm font-medium text-gray-700">
              Request a new verification link
            </label>
            <input
              id="resend-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email address"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-orange-500"
            />
            <button type="submit" disabled={resending} className="w-full rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600 disabled:opacity-60">
              {resending ? "Sending..." : "Resend verification email"}
            </button>
            {resendMessage && <p className="text-sm text-gray-600" role="status">{resendMessage}</p>}
          </form>
        )}
      </section>
    </main>
  );
}

export default VerifyEmail;
