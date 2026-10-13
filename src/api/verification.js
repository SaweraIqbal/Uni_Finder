import { API, authHeaders } from "./client";

/* ------------------------------------------------------------------ */
/*  Admin — unchanged                                                  */
/* ------------------------------------------------------------------ */

export async function searchAccount(q) {
  const res = await fetch(
    `${API}/api/admin/search?q=${encodeURIComponent(q)}`,
    {
      headers: authHeaders(),
    },
  );
  return { ok: res.ok, status: res.status, data: await res.json() };
}

export async function listVerifications(statusTab = "pending") {
  const res = await fetch(
    `${API}/api/admin/verifications?status=${encodeURIComponent(statusTab)}`,
    { headers: authHeaders() },
  );
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

/* ------------------------------------------------------------------ */
/*  University verification flow                                       */
/* ------------------------------------------------------------------ */

/**
 * GET /api/universities
 * Expected: [{ id, name, domain }]   (domain optional, e.g. "riphah.edu.pk")
 * Used for the dropdown + email-domain check in the verification form.
 */
export async function getUniversities() {
  const res = await fetch(`${API}/api/universities?all=true`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to load universities");
  return Array.isArray(data) ? data : data.universities || [];
}

/**
 * GET /api/university/verification/:uid
 * Returns the user's verification record, or null if none exists yet.
 * Expected shape:
 * {
 *   id, status: "pending" | "approved" | "rejected",
 *   full_name, designation, phone,
 *   university_id, university_name,
 *   official_email, email_domain_verified,
 *   reject_reason        // only when status === "rejected"
 * }
 */
export async function getMyVerification(uid) {
  const res = await fetch(`${API}/api/university/verification/${uid}`);

  // No application submitted yet → form should show
  if (res.status === 404) return null;

  if (!res.ok) throw new Error("Could not load your verification status.");

  const data = await res.json().catch(() => null);
  // Supports both a direct object and a wrapped { verification: {...} }
  const record = data?.verification ?? data;
  return record && Object.keys(record).length > 0 ? record : null;
}

/**
 * POST /api/university/verification   (multipart/form-data)
 * FormData fields: userId, full_name, designation, university_id,
 * university_name, official_email, email_domain_verified,
 * phone (optional), authorization_letter (File, optional)
 *
 * NOTE: no Content-Type header — the browser sets the multipart
 * boundary automatically. Same as your old submitDocuments.
 */
export async function submitUniversityVerification(formData, onProgress = () => {}) {
  const res = await new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `${API}/api/university/verification`);
    request.setRequestHeader("Authorization", authHeaders().Authorization);
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    });
    request.addEventListener("load", () => resolve(request));
    request.addEventListener("error", () => reject(new Error("Network error. Please try again.")));
    request.addEventListener("abort", () => reject(new Error("Request cancelled.")));
    request.send(formData);
  });
  let data;
  try {
    data = JSON.parse(res.responseText || "{}");
  } catch {
    data = {};
  }
  if (res.status < 200 || res.status >= 300) {
    const error = new Error(data.message || data.error || "Could not submit your application.");
    error.fieldErrors = data.errors || null;
    throw error;
  }
  return data;
}

/* ── Super-admin: universities, programs, activity (Phase 2) ── */

export async function adminListUniversities({ q = "", type = "", profile_status = "", scope = "approved", claimed = "", page = 1, limit = 25 } = {}) {
  const params = new URLSearchParams();
  if (q)              params.set("q", q);
  if (type)           params.set("type", type);
  if (profile_status) params.set("profile_status", profile_status);
  if (scope)          params.set("scope", scope);
  if (claimed !== "") params.set("claimed", claimed);
  params.set("page", String(page));
  params.set("limit", String(limit));
  const res = await fetch(`${API}/api/admin/universities?${params}`, { headers: authHeaders() });
  return { ok: res.ok, status: res.status, data: await res.json() };
}

export async function adminListPrograms({ university_id = "", level = "", status = "", q = "", page = 1, limit = 25 } = {}) {
  const params = new URLSearchParams();
  if (university_id) params.set("university_id", university_id);
  if (level)         params.set("level", level);
  if (status)        params.set("status", status);
  if (q)             params.set("q", q);
  params.set("page", String(page));
  params.set("limit", String(limit));
  const res = await fetch(`${API}/api/admin/programs?${params}`, { headers: authHeaders() });
  return { ok: res.ok, status: res.status, data: await res.json() };
}

export async function adminListProgramRequests({ status = "pending", page = 1, limit = 25 } = {}) {
  const params = new URLSearchParams({ status, page: String(page), limit: String(limit) });
  const res = await fetch(`${API}/api/admin/program-requests?${params}`, { headers: authHeaders() });
  return { ok: res.ok, status: res.status, data: await res.json() };
}

export async function adminApproveProgramRequest(id) {
  const res = await fetch(`${API}/api/admin/program-requests/${id}/approve`, {
    method: "PUT",
    headers: authHeaders(),
  });
  return { ok: res.ok, data: await res.json() };
}

export async function adminRejectProgramRequest(id, reason) {
  const res = await fetch(`${API}/api/admin/program-requests/${id}/reject`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  return { ok: res.ok, data: await res.json() };
}

export async function adminListActivity({ university_id = "", page = 1, limit = 25 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (university_id) params.set("university_id", university_id);
  const res = await fetch(`${API}/api/admin/activity?${params}`, { headers: authHeaders() });
  return { ok: res.ok, status: res.status, data: await res.json() };
}

/* ── Super-admin: campus registrations ─────────────────────────────────── */

/**
 * GET /api/admin/campus-registrations
 * Returns { total, page, limit, pages, registrations[], stats }
 * where stats = { pending, approved, rejected, resubmission, total }
 */
export async function adminListCampusRegistrations({
  status = "",
  q      = "",
  page   = 1,
  limit  = 50,
} = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set("status", status);
  if (q)      params.set("q", q);
  const res = await fetch(
    `${API}/api/admin/campus-registrations?${params}`,
    { headers: authHeaders() }
  );
  return { ok: res.ok, status: res.status, data: await res.json() };
}

/**
 * PATCH /api/admin/campus-registrations/:id/status
 * body: { action, reason?, note?, requiredDocs? }
 * action: "approve" | "reject" | "request_resubmission"
 */
export async function adminUpdateCampusRegistrationStatus(id, body) {
  const res = await fetch(
    `${API}/api/admin/campus-registrations/${id}/status`,
    {
      method:  "PATCH",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    }
  );
  return { ok: res.ok, status: res.status, data: await res.json() };
}
