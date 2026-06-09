// Single place for the backend base URL and common request helpers.
// Every page/component imports from here instead of hard-coding the URL.
export const API = "http://localhost:5000";

// Bearer token header for protected (admin) endpoints.
export const authHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
});

// Turn a stored path (e.g. /uploads/x.pdf) into a full, openable URL.
export const fileUrl = (p) => (p ? `${API}${p}` : null);
