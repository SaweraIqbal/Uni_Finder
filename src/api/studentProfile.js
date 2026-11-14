/**
 * studentProfile.js  — All frontend API calls for the student profile.
 * Uses the JWT stored in sessionStorage (set by AuthContext on login).
 * Base URL: http://localhost:5000/api/student
 */

const BASE = "http://localhost:5000/api/student";

// ── Auth header helper ────────────────────────────────────────────────────────
const authHeaders = (extra = {}) => {
  const token = sessionStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
};

const authHeadersNoContentType = () => {
  const token = sessionStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ── Generic fetch wrappers ────────────────────────────────────────────────────
const get = async (path) => {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
};

const put = async (path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
};

const post = async (path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
};

const del = async (path) => {
  const res = await fetch(`${BASE}${path}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
};

// ── Profile ───────────────────────────────────────────────────────────────────
export const fetchProfile          = ()       => get("/profile");
export const fetchProfileForEdit   = ()       => get("/profile/edit");
export const saveProfile           = (body)   => put("/profile", body);
export const fetchCompleteness     = ()       => get("/completeness");

// ── Academic Records ──────────────────────────────────────────────────────────
export const fetchAcademicRecords  = ()       => get("/academic-records");
export const createAcademicRecord  = (body)   => post("/academic-records", body);
export const updateAcademicRecord  = (id, b)  => put(`/academic-records/${id}`, b);
export const deleteAcademicRecord  = (id)     => del(`/academic-records/${id}`);

// ── Test Scores ───────────────────────────────────────────────────────────────
export const fetchTestScores       = ()       => get("/test-scores");
export const createTestScore       = (body)   => post("/test-scores", body);
export const updateTestScore       = (id, b)  => put(`/test-scores/${id}`, b);
export const deleteTestScore       = (id)     => del(`/test-scores/${id}`);

// ── Research Profile ──────────────────────────────────────────────────────────
export const fetchResearch         = ()       => get("/research");
export const saveResearch          = (body)   => put("/research", body);
export const createPublication     = (body)   => post("/research/publications", body);
export const updatePublication     = (id, b)  => put(`/research/publications/${id}`, b);
export const deletePublication     = (id)     => del(`/research/publications/${id}`);

// ── References ────────────────────────────────────────────────────────────────
export const fetchReferences       = ()       => get("/references");
export const createReference       = (body)   => post("/references", body);
export const updateReference       = (id, b)  => put(`/references/${id}`, b);
export const deleteReference       = (id)     => del(`/references/${id}`);

// ── Experience ────────────────────────────────────────────────────────────────
export const fetchExperience       = ()       => get("/experience");
export const createExperience      = (body)   => post("/experience", body);
export const updateExperience      = (id, b)  => put(`/experience/${id}`, b);
export const deleteExperience      = (id)     => del(`/experience/${id}`);

// ── Preferences ───────────────────────────────────────────────────────────────
export const fetchPreferences      = ()       => get("/preferences");
export const savePreferences       = (body)   => put("/preferences", body);

// ── Documents ─────────────────────────────────────────────────────────────────
export const fetchDocuments        = ()       => get("/documents");

// ── File upload ───────────────────────────────────────────────────────────────
/**
 * Upload a profile photo (public storage, no auth needed to view).
 * Uses the dedicated /upload/avatar endpoint.
 */
export const uploadAvatar = (file, onProgress) => {
  return new Promise((resolve, reject) => {
    const token = sessionStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("doc_type", "photo");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE}/upload/avatar`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, data });
      } catch {
        resolve({ ok: false, status: xhr.status, data: { message: "Parse error" } });
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(formData);
  });
};

/**
 * Upload a private student document (CNIC, transcript, scorecard, etc.)
 */
export const uploadStudentFile = (file, docType, onProgress) => {
  return new Promise((resolve, reject) => {
    const token = sessionStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("doc_type", docType);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE}/upload`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, data });
      } catch {
        resolve({ ok: false, status: xhr.status, data: { message: "Parse error" } });
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(formData);
  });
};

/**
 * Returns the full URL for serving a student file through the authenticated endpoint.
 * This should be used as the src/href for displaying or linking to files.
 */
export const studentFileUrl = (relativeUrl) => {
  if (!relativeUrl) return null;
  if (relativeUrl.startsWith("http")) return relativeUrl;
  return `http://localhost:5000${relativeUrl}`;
};

/**
 * Delete a file by its filename (not the full URL).
 */
export const deleteStudentFile = (filename) => del(`/files/${filename}`);
