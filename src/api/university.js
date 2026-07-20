
import { API } from "./client";
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
