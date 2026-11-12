import { API } from "../../../shared/api/client";
export async function getProgramHierarchy({ signal } = {}) {
  const res = await fetch(`${API}/api/programs/hierarchy`, { signal });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Could not load the program hierarchy.");
  }
  return data;
}

export async function searchDistinctPrograms({ q = "", level = "", limit = 10, signal } = {}) {
  const params = new URLSearchParams({ q, limit: String(limit) });
  if (level) params.set("level", level);
  const res = await fetch(`${API}/api/programs/search?${params}`, { signal });
  const data = await res.json().catch(() => []);
  if (!res.ok) {
    throw new Error(data?.message || "Could not load program suggestions.");
  }
  return data;
}

export async function searchCampusesForProgram({ program, level = "" }) {
  const params = new URLSearchParams({ program });
  params.set("level", level);
  const res = await fetch(`${API}/api/programs/search/results?${params}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Could not load campuses for this program.");
  }
  return data;
}

export async function getMyUniversity(uid) {
  const res = await fetch(`${API}/api/university/${uid}/profile`);
  return res.json();
}
export async function saveUniversity(formData) {
  const res = await fetch(`${API}/api/university/profile`, {
    method: "POST",
    body: formData,
  });
  return { ok: res.ok, data: await res.json() };
}

export async function listUniversities() {
  const res = await fetch(`${API}/api/universities`);
  return res.json();
}

export async function getUniversityById(id) {
  const res = await fetch(`${API}/api/universities/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export async function getAccount(uid) {
  const res = await fetch(`${API}/api/university/account/${uid}`);
  return res.json();
}

export async function uploadAvatar(uid, file) {
  const fd = new FormData();
  fd.append("avatar", file);
  const res = await fetch(`${API}/api/account/${uid}/avatar`, {
    method: "POST",
    body: fd,
  });
  return { ok: res.ok, data: await res.json() };
}

export async function updateAccount(payload) {
  const res = await fetch(`${API}/api/university/account`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, data: await res.json() };
}

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

import { authHeaders } from "../../../shared/api/client";

export async function getMe() {
  const res = await fetch(`${API}/api/universities/me`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || "Failed to load university data.");
  return data;
}

export async function getMeStats() {
  const res = await fetch(`${API}/api/universities/me/stats`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || "Failed to load stats.");
  return data;
}

export async function getMePrograms({ level, status, q, page = 1, limit = 25 } = {}) {
  const params = new URLSearchParams();
  if (level)  params.set("level",  level);
  if (status) params.set("status", status);
  if (q)      params.set("q",      q);
  params.set("page",  String(page));
  params.set("limit", String(limit));
  const res = await fetch(`${API}/api/universities/me/programs?${params}`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || "Failed to load programs.");
  return data;
}

export async function getMeActivity(limit = 10) {
  const res = await fetch(`${API}/api/universities/me/activity?limit=${limit}`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || "Failed to load activity.");
  return Array.isArray(data) ? data : [];
}

export async function patchMeProfile(payload) {
  const res = await fetch(`${API}/api/universities/me/profile`, {
    method: "PATCH",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export async function uploadMeLogo(file) {
  const fd = new FormData();
  fd.append("logo", file);
  const res = await fetch(`${API}/api/universities/me/logo`, {
    method: "POST",
    headers: authHeaders(),
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function uploadMeBanner(file) {
  const fd = new FormData();
  fd.append("banner", file);
  const res = await fetch(`${API}/api/universities/me/banner`, {
    method: "POST",
    headers: authHeaders(),
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function getMyGallery() {
  const res = await fetch(`${API}/api/universities/me/gallery`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || "Could not load gallery.");
  return data;
}

export async function uploadMyGalleryImage({ file, caption = "" }) {
  const fd = new FormData();
  fd.append("image", file);
  fd.append("caption", caption);
  const res = await fetch(`${API}/api/universities/me/gallery`, {
    method: "POST",
    headers: authHeaders(),
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function deleteMyGalleryImage(imageId) {
  const res = await fetch(`${API}/api/universities/me/gallery/${imageId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function searchProgramCatalog({ q, level, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (q)     params.set("q",     q);
  if (level) params.set("level", level);
  params.set("page",  String(page));
  params.set("limit", String(limit));
  const res = await fetch(`${API}/api/programs/catalog?${params}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || "Failed to search catalog.");
  return data;
}

export async function uniAdminListCampusRegistrations({
  status = "",
  q      = "",
  page   = 1,
  limit  = 50,
} = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set("status", status);
  if (q)      params.set("q", q);
  const res = await fetch(
    `${API}/api/campus-registrations?${params}`,
    { headers: authHeaders() }
  );
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
}

export async function uniAdminUpdateCampusStatus(id, body) {
  const res = await fetch(
    `${API}/api/campus-registrations/${id}/tier1`,
    {
      method:  "PATCH",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    }
  );
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
}
