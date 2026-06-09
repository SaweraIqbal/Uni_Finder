// University profile + public university API calls.
import { API } from "./client";

// UNI ADMIN: get the university record owned by this uid (or null).
export async function getMyUniversity(uid) {
  const res = await fetch(`${API}/api/university/${uid}/profile`);
  return res.json();
}

// UNI ADMIN: create/update university details. `formData` is FormData (may include logo/banner).
export async function saveUniversity(formData) {
  const res = await fetch(`${API}/api/university/profile`, {
    method: "POST",
    body: formData,
  });
  return { ok: res.ok, data: await res.json() };
}

// PUBLIC: list all universities (id, name, city, logo, tagline).
export async function listUniversities() {
  const res = await fetch(`${API}/api/universities`);
  return res.json();
}

// PUBLIC: full university record by id.
export async function getUniversityById(id) {
  const res = await fetch(`${API}/api/universities/${id}`);
  if (!res.ok) return null;
  return res.json();
}

// UNI ADMIN: get own account (name, username, email).
export async function getAccount(uid) {
  const res = await fetch(`${API}/api/university/account/${uid}`);
  return res.json();
}

// UNI ADMIN: update own account.
export async function updateAccount(payload) {
  const res = await fetch(`${API}/api/university/account`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, data: await res.json() };
}

// ---- Gallery images (public list; admin add/delete) ----
export async function listImages(universityId) {
  const res = await fetch(`${API}/api/university/${universityId}/images`);
  return res.json();
}
export async function addImage(formData) {
  const res = await fetch(`${API}/api/university/images`, { method: "POST", body: formData });
  return { ok: res.ok, data: await res.json() };
}
export async function deleteImage(imageId) {
  const res = await fetch(`${API}/api/university/images/${imageId}`, { method: "DELETE" });
  return { ok: res.ok, data: await res.json() };
}

// ---- Programs (public list; admin add/delete) ----
export async function listPrograms(universityId) {
  const res = await fetch(`${API}/api/university/${universityId}/programs`);
  return res.json();
}
export async function addProgram(payload) {
  const res = await fetch(`${API}/api/university/programs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, data: await res.json() };
}
export async function deleteProgram(programId) {
  const res = await fetch(`${API}/api/university/programs/${programId}`, { method: "DELETE" });
  return { ok: res.ok, data: await res.json() };
}
