/**
 * Utility helpers for university data.
 * All university data is now served exclusively from the MySQL backend API.
 */

// Kept as a no-op so callers get null and handle it gracefully.
export function findUniversity(_id) {
  return null;
}

export function formatPKR(amount) {
  if (amount >= 100000) {
    return `PKR ${(amount / 1000).toFixed(0)}k`;
  }
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

export function formatDistance(km) {
  if (km === 0 || km == null) return "—";
  if (km < 1) return `${(km * 1000).toFixed(0)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${km.toFixed(0)} km`;
}
