import { toast } from "react-toastify";


export const setFlash = (message, type = "success") => {
  try {
    sessionStorage.setItem("flash", JSON.stringify({ message, type }));
  } catch {
 
  }
};

export const showFlashOnce = () => {
  let raw = null;
  try {
    raw = sessionStorage.getItem("flash");
  } catch {
    return;
  }
  if (!raw) return;
  sessionStorage.removeItem("flash"); 
  try {
    const { message, type } = JSON.parse(raw);
    (toast[type] || toast)(message);
  } catch {

  }
};
