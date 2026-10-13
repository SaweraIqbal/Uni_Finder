/**
 * campus.js  —  all frontend API helpers for the Campus Admin Dashboard.
 * Base URL: http://localhost:5000 (from client.js)
 */
import { API, authHeaders } from "./client";

export const CAMPUS_DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1562774053-701939374585?w=1200&auto=format&fit=crop&q=80";

export function campusImage(c, fileUrl) {
  const p = c?.cover_image || c?.university_banner;
  return p ? fileUrl(p) : CAMPUS_DEFAULT_IMAGE;
}

/* ── Registration (legacy) ─────────────────────────────────────────────────── */
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
export async function listCampusRequestsForOwner(ownerUid) {
  const res = await fetch(`${API}/api/campus/requests/owner/${ownerUid}`);
  return res.json();
}
export async function approveCampus(id) {
  const res = await fetch(`${API}/api/campus/requests/${id}/approve`, {
    method: "PUT", headers: authHeaders(),
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

/* ── Campus profile ────────────────────────────────────────────────────────── */
export async function getMyCampus(uid) {
  const res = await fetch(`${API}/api/campus/${uid}/profile`);
  return res.json();
}
export async function saveCampus(payload) {
  const res = await fetch(`${API}/api/campus/profile`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, data: await res.json() };
}

/* ── Overview stats + activity ─────────────────────────────────────────────── */
export async function getCampusOverviewStats(campusId) {
  const res = await fetch(`${API}/api/campus/${campusId}/overview-stats`, {
    headers: authHeaders(),
  });
  return res.json();
}
export async function getCampusActivity(campusId, limit = 10) {
  const res = await fetch(`${API}/api/campus/${campusId}/activity?limit=${limit}`, {
    headers: authHeaders(),
  });
  return res.json();
}

/* ── Images ────────────────────────────────────────────────────────────────── */
export async function listCampusImages(campusId) {
  const res = await fetch(`${API}/api/campus/${campusId}/images`);
  return res.json();
}
export async function addCampusImage(formData) {
  const res = await fetch(`${API}/api/campus/images`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  return { ok: res.ok, data: await res.json() };
}
export async function deleteCampusImage(imageId) {
  const res = await fetch(`${API}/api/campus/images/${imageId}`, { method: "DELETE" });
  return { ok: res.ok, data: await res.json() };
}
export async function featureCampusImage(imageId) {
  const res = await fetch(`${API}/api/campus/images/${imageId}/feature`, {
    method: "PUT", headers: authHeaders(),
  });
  return { ok: res.ok, data: await res.json() };
}

/* ── Programs (basic) ──────────────────────────────────────────────────────── */
export async function listCampusPrograms(campusId) {
  const res = await fetch(`${API}/api/campus/${campusId}/programs`);
  return res.json();
}
// All approved programs for a university — used by the campus "Add Program" picker
export async function listUniversityApprovedPrograms(universityId) {
  const res = await fetch(`${API}/api/universities/${universityId}/programs/approved`);
  if (!res.ok) return [];
  return res.json();
}
export async function addCampusProgram(payload) {
  const res = await fetch(`${API}/api/campus/programs`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, data: await res.json() };
}
export async function deleteCampusProgram(id) {
  const res = await fetch(`${API}/api/campus/programs/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return { ok: res.ok, data: await res.json() };
}

/* ── Program detail (rich form) ────────────────────────────────────────────── */
export async function getCampusProgramDetail(id) {
  const res = await fetch(`${API}/api/campus/programs/${id}/detail`, {
    headers: authHeaders(),
  });
  return { ok: res.ok, data: await res.json() };
}
export async function saveCampusProgramDetail(id, payload) {
  const res = await fetch(`${API}/api/campus/programs/${id}/detail`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, data: await res.json() };
}
export async function publishCampusProgram(id) {
  const res = await fetch(`${API}/api/campus/programs/${id}/publish`, {
    method: "PUT", headers: authHeaders(),
  });
  return { ok: res.ok, data: await res.json() };
}
export async function unpublishCampusProgram(id) {
  const res = await fetch(`${API}/api/campus/programs/${id}/unpublish`, {
    method: "PUT", headers: authHeaders(),
  });
  return { ok: res.ok, data: await res.json() };
}

/* ── Program requests ──────────────────────────────────────────────────────── */
export async function listCampusProgramRequests(campusId) {
  const res = await fetch(`${API}/api/campus/${campusId}/program-requests`, {
    headers: authHeaders(),
  });
  return res.json();
}
export async function submitCampusProgramRequest(payload) {
  const res = await fetch(`${API}/api/campus/program-requests`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, data: await res.json() };
}

/* ── Societies ─────────────────────────────────────────────────────────────── */
export async function listCampusSocieties(campusId) {
  const res = await fetch(`${API}/api/campus/${campusId}/societies`, {
    headers: authHeaders(),
  });
  return res.json();
}
export async function addCampusSociety(campusId, payload) {
  const res = await fetch(`${API}/api/campus/${campusId}/societies`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, data: await res.json() };
}
export async function updateCampusSociety(id, payload) {
  const res = await fetch(`${API}/api/campus/societies/${id}`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, data: await res.json() };
}
export async function deleteCampusSociety(id) {
  const res = await fetch(`${API}/api/campus/societies/${id}`, {
    method: "DELETE", headers: authHeaders(),
  });
  return { ok: res.ok, data: await res.json() };
}

/* ── Facilities ────────────────────────────────────────────────────────────── */
export async function getCampusFacilities(campusId) {
  const res = await fetch(`${API}/api/campus/${campusId}/facilities`, {
    headers: authHeaders(),
  });
  return { ok: res.ok, data: await res.json() };
}
export async function saveCampusFacilities(campusId, payload) {
  const res = await fetch(`${API}/api/campus/${campusId}/facilities`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, data: await res.json() };
}

/* ── Hostels ───────────────────────────────────────────────────────────────── */
export async function listCampusHostels(campusId) {
  const res = await fetch(`${API}/api/campus/${campusId}/hostels`, {
    headers: authHeaders(),
  });
  return res.json();
}
export async function setHostelAvailability(campusId, available) {
  const res = await fetch(`${API}/api/campus/${campusId}/hostel-availability`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ hostel_available: available }),
  });
  return { ok: res.ok, data: await res.json() };
}
export async function listHostelApprovals(campusId) {
  const res = await fetch(`${API}/api/campus/${campusId}/hostel-approvals`, {
    headers: authHeaders(),
  });
  return res.json();
}
export async function approveHostel(id) {
  const res = await fetch(`${API}/api/campus/hostel-approvals/${id}/approve`, {
    method: "PUT", headers: authHeaders(),
  });
  return { ok: res.ok, data: await res.json() };
}
export async function rejectHostel(id, reason) {
  const res = await fetch(`${API}/api/campus/hostel-approvals/${id}/reject`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  return { ok: res.ok, data: await res.json() };
}

/* ── Public search / detail ────────────────────────────────────────────────── */
export async function listUniversitiesForPicker() {
  const res = await fetch(`${API}/api/universities`);
  return res.json();
}
export async function searchCampuses({ city, university, program } = {}) {
  const qs = new URLSearchParams();
  if (city)       qs.set("city",       city);
  if (university) qs.set("university", university);
  if (program)    qs.set("program",    program);
  const res = await fetch(`${API}/api/campuses?${qs.toString()}`);
  return res.json();
}
export async function getCampusDetail(id) {
  const res = await fetch(`${API}/api/campuses/${id}`);
  if (!res.ok) return null;
  return res.json();
}
