export const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

export const authHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
});
export const fileUrl = (p) => (p ? `${API}${p}` : null);

export async function signup(payload) {
  const res = await fetch(`${API}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, status: res.status, data: await res.json() };
}

export async function resendVerificationEmail(email) {
  const res = await fetch(`${API}/api/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return { ok: res.ok, status: res.status, data: await res.json() };
}

export async function login(email, password) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return { ok: res.ok, status: res.status, data: await res.json() };
}

export async function forgotPassword(email) {
  const res = await fetch(`${API}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return { ok: res.ok, status: res.status, data: await res.json() };
}

export async function resetPassword(token, password) {
  const res = await fetch(`${API}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  return { ok: res.ok, status: res.status, data: await res.json() };
}

export async function reportMissingUniversity(payload) {
  const res = await fetch(`${API}/api/contact/university-not-found`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, status: res.status, data: await res.json() };
}
