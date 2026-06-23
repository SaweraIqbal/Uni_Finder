
import { API, authHeaders } from "./client";
export const CAMPUS_DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1562774053-701939374585?w=1200&auto=format&fit=crop&q=80";

export function campusImage(c, fileUrl) {
  const path = c?.cover_image || c?.university_banner;
  return path ? fileUrl(path) : CAMPUS_DEFAULT_IMAGE;
}

export async function submitCampusRequest(payload) {
  const res = await fetch(`${API}/api/campus/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, data: await res.json() };
}

export async function getMyCampusRequest(uid) {
  const res = await fetch(`${API}/api/campus/request/${uid}`);
  return res.json();
}

export async function getMyCampus(uid) {
  const res = await fetch(`${API}/api/campus/${uid}/profile`);
  return res.json();
}
export async function saveCampus(payload) {
  const res = await fetch(`${API}/api/campus/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, data: await res.json() };
}

export async function listCampusRequestsForOwner(ownerUid) {
  const res = await fetch(`${API}/api/campus/requests/owner/${ownerUid}`);
  return res.json();
}

export async function approveCampus(id) {
  const res = await fetch(`${API}/api/campus/requests/${id}/approve`, {
    method: "PUT",
    headers: authHeaders(),
  });
  return { ok: res.ok, data: await res.json() };
}

export async function rejectCampus(id, reason) {
  const res = await fetch(`${API}/api/campus/requests/${id}/reject`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  return { ok: res.ok, data: await res.json() };
}

export async function listUniversitiesForPicker() {
  const res = await fetch(`${API}/api/universities`);
  return res.json();
}

export async function searchCampuses({ city, university, program } = {}) {
  const qs = new URLSearchParams();
  if (city) qs.set("city", city);
  if (university) qs.set("university", university);
  if (program) qs.set("program", program);
  const res = await fetch(`${API}/api/campuses?${qs.toString()}`);
  return res.json();
}

export async function getCampusDetail(id) {
  const res = await fetch(`${API}/api/campuses/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export async function listCampusImages(campusId) {
  const res = await fetch(`${API}/api/campus/${campusId}/images`);
  return res.json();
}
export async function addCampusImage(formData) {
  const res = await fetch(`${API}/api/campus/images`, { method: "POST", body: formData });
  return { ok: res.ok, data: await res.json() };
}
export async function deleteCampusImage(imageId) {
  const res = await fetch(`${API}/api/campus/images/${imageId}`, { method: "DELETE" });
  return { ok: res.ok, data: await res.json() };
}

export async function listCampusPrograms(campusId) {
  const res = await fetch(`${API}/api/campus/${campusId}/programs`);
  return res.json();
}
export async function addCampusProgram(payload) {
  const res = await fetch(`${API}/api/campus/programs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, data: await res.json() };
}
export async function deleteCampusProgram(id) {
  const res = await fetch(`${API}/api/campus/programs/${id}`, { method: "DELETE" });
  return { ok: res.ok, data: await res.json() };
}
