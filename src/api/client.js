export const API = "http://localhost:5000";

export const authHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
});
export const fileUrl = (p) => (p ? `${API}${p}` : null);
