import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import db from "../../config/db.js";
import jwt from "jsonwebtoken";
import { assignedIdFor } from "../../utils/assignedId.js";

export const signup = (req, res) => {
  const userId = uuidv4();

  const { name, username, email, password, role } = req.body;
  console.log("ROLE FROM FRONTEND:", role);

  const hashedPassword = bcrypt.hashSync(password, 10);

  const assignedId = assignedIdFor(role, userId);

  const sql = `
    INSERT INTO Student_signup (id, name, username, email, password, role, assigned_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [userId, name, username, email, hashedPassword, role, assignedId],
    (err, result) => {
      if (err) {
        return res.status(500).json(err);
      }

      const token = jwt.sign(
        { id: userId, email, role },
        process.env.JWT_SECRET || "secretkey",
        { expiresIn: process.env.JWT_EXPIRY || "1d" },
      );
      return res.status(201).json({
        message: "Signup successful",
        token,
        user: {
          id: userId,
          email,
          role,
          assigned_id: assignedId,
        },
      });
    },
  );
};

export const login = (req, res) => {
  const { email, password } = req.body;

  // ── Input validation ──────────────────────────────────────────────────────
  if (!email || typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ message: "Email is required" });
  }
  if (!password || typeof password !== "string") {
    return res.status(400).json({ message: "Password is required" });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  db.query("SELECT * FROM Student_signup WHERE email = ?", [email.trim()], async (err, result) => {
    if (err) {
      console.error("[login] DB error:", err.message);
      return res.status(500).json({ message: "Server error, please try again" });
    }
    if (result.length === 0) return res.status(404).json({ message: "No account found with this email" });

    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect password" });

    // ── Additive: resolve university_id if the account owns one ──────────────
    let universityId = null;
    if (user.role === "university") {
      try {
        await new Promise((resolve) => {
          db.query(
            "SELECT id FROM universities WHERE owner_uid = ? LIMIT 1",
            [user.id],
            (e, rows) => {
              if (!e && rows.length) universityId = rows[0].id;
              resolve();
            },
          );
        });
      } catch (_) { /* non-fatal — university_id stays null */ }
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    if (universityId) payload.university_id = universityId;   // additive only

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1d" },
    );

    return res.status(200).json({
      message: "Login Successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        ...(universityId ? { university_id: universityId } : {}),
      },
    });
  });
};
