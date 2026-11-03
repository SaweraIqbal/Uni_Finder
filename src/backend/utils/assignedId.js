

const PREFIX = {
  university: "UNI",
  campus: "CMP",
  hostel: "HST",
  campus_hostel: "CHS",
};

export const assignedIdFor = (role, id) => {
  const p = PREFIX[role];
  if (!p || !id) return null;
  return `${p}-${String(id).replace(/-/g, "").slice(0, 6).toUpperCase()}`;
};

export default assignedIdFor;
