export const API = "http://localhost:5000";

export const authHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
});
console.log("session:", sessionStorage.getItem("token"));
console.log("local:", localStorage.getItem("token"));
export const fileUrl = (p) => (p ? `${API}${p}` : null);
