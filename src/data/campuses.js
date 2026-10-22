/**
 * Utility helpers for campus data.
 * All campus data is now served exclusively from the MySQL backend API.
 */

export function formatPKR(amount) {
  if (!amount || amount === 0) return "See details";
  if (amount >= 100000) return `PKR ${(amount / 1000).toFixed(0)}k / sem`;
  return `PKR ${amount.toLocaleString("en-PK")} / sem`;
}

export function formatDistance(km) {
  if (km === 0 || km == null) return "—";
  if (km < 1) return `${(km * 1000).toFixed(0)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${km.toFixed(0)} km`;
}

// Kept as a no-op so CampusDetailPage can still call it and get null
// (it already handles the null → "Campus not found" case).
export function getCampusById(_id) {
  return null;
}

// Kept as a no-op so any remaining callers get an empty array.
export function getCampusesForUniversity(_universityId) {
  return [];
}
