import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API, resendVerificationEmail } from "../api/client";
import logo from "../assets/Logo.png";

function VerifyEmail() {
  const { token } = useParams();
  const [state, setState] = useState({ loading: false, success: false, complete: false, message: "" });
  const [email, setEmail] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [resending, setResending] = useState(false);

  const heading = state.loading
    ? "Verifying your email..."
    : state.complete
      ? state.success ? "Email verified" : "Verification failed"
      : "Confirm your email";

  const verify = async () => {
    setState((current) => ({ ...current, loading: true, message: "" }));
    try {
      const response = await fetch(`${API}/api/auth/verify-email/${encodeURIComponent(token)}`, {
        method: "POST",
      });
      const data = await response.json();
      setState({
        loading: false,
        success: response.ok,
        complete: true,
        message: data.message || "Could not verify this email address.",
      });
    } catch {
      setState({
        loading: false,
        success: false,
        complete: true,
        message: "Could not reach the server. Please try again.",
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
        {state.complete && !state.loading && state.success && (
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
