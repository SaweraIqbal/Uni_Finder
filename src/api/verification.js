
import { API, authHeaders } from "./client";

export async function searchAccount(q) {
  const res = await fetch(`${API}/api/admin/search?q=${encodeURIComponent(q)}`, {
    headers: authHeaders(),
  });
  return { ok: res.ok, status: res.status, data: await res.json() };
}

export async function listVerifications() {
  const res = await fetch(`${API}/api/admin/verifications`, {
    headers: authHeaders(),
  });
  return { ok: res.ok, status: res.status, data: await res.json() };
}

export async function approveVerification(id) {
  const res = await fetch(`${API}/api/admin/verifications/${id}/approve`, {
    method: "PUT",
    headers: authHeaders(),
  });
  return { ok: res.ok, data: await res.json() };
}

export async function rejectVerification(id, reason) {
  const res = await fetch(`${API}/api/admin/verifications/${id}/reject`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  return { ok: res.ok, data: await res.json() };
}

export async function getMyVerification(uid) {
  const res = await fetch(`${API}/api/university/verification/${uid}`);
  return res.json();
}

export async function submitDocuments(formData) {
  const res = await fetch(`${API}/api/university/documents`, {
    method: "POST",
    body: formData,
  });
  return { ok: res.ok, data: await res.json() };
}
