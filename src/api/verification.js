// All university-verification API calls live here so pages stay thin.
import { API, authHeaders } from "./client";

// SUPERADMIN: list all verification requests (with admin info).
export async function listVerifications() {
  const res = await fetch(`${API}/api/admin/verifications`, {
    headers: authHeaders(),
  });
  return { ok: res.ok, status: res.status, data: await res.json() };
}

// SUPERADMIN: approve a request -> emails the uni admin.
export async function approveVerification(id) {
  const res = await fetch(`${API}/api/admin/verifications/${id}/approve`, {
    method: "PUT",
    headers: authHeaders(),
  });
  return { ok: res.ok, data: await res.json() };
}

// SUPERADMIN: reject with a reason -> emails the uni admin.
export async function rejectVerification(id, reason) {
  const res = await fetch(`${API}/api/admin/verifications/${id}/reject`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  return { ok: res.ok, data: await res.json() };
}

// UNI ADMIN: my latest verification status.
export async function getMyVerification(uid) {
  const res = await fetch(`${API}/api/university/verification/${uid}`);
  return res.json();
}

// UNI ADMIN: submit verification documents (FormData with files).
export async function submitDocuments(formData) {
  const res = await fetch(`${API}/api/university/documents`, {
    method: "POST",
    body: formData,
  });
  return { ok: res.ok, data: await res.json() };
}
