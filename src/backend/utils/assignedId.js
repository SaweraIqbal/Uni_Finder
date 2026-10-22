

const PREFIX = { university: "UNI", campus: "CMP" };

export const assignedIdFor = (role, id) => {
  const p = PREFIX[role];
  if (!p || !id) return null;
  return `${p}-${String(id).replace(/-/g, "").slice(0, 6).toUpperCase()}`;
};

export default assignedIdFor;
