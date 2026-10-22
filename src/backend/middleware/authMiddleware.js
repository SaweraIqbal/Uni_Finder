import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "No token provided"
    });
  }

  const token = authHeader.split(" ")[1];

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secretkey"
    );

    req.user = decoded;

    next();

  } catch (err) {

    return res.status(403).json({
      message: "Invalid Token"
    });

  }
};



const ROLE_ALIASES = {
  uni: "university",
  university_admin: "university",
};
const normalizeRole = (r) => {
  const key = String(r || "").toLowerCase();
  return ROLE_ALIASES[key] || key;
};

export const authorizeRoles = (...roles) => {
  const allowed = roles.map(normalizeRole);
  return (req, res, next) => {
    const role = normalizeRole(req.user?.role);
    if (!allowed.includes(role)) {
      console.log("AUTH DENIED -> token role:", req.user?.role, "| allowed:", roles);
      return res.status(403).json({ message: "Access Denied" });
    }
    next();
  };
};

