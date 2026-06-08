import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import db from "../../config/db.js";
import jwt from "jsonwebtoken";

export const signup = (req, res) => {
  const userId = uuidv4();

  const { name, username, email, password, role } = req.body;
  console.log("ROLE FROM FRONTEND:", role);

  const hashedPassword = bcrypt.hashSync(password, 10);

  const sql = `
    INSERT INTO Student_signup (id, name, username, email, password,role)
    VALUES (?, ?, ?, ?, ?,?)
  `;

  db.query(
    sql,
    [userId, name, username, email, hashedPassword, role],
    (err, result) => {
      if (err) {
        return res.status(500).json(err);
      }

      return res.status(201).json({
        message: "Signup successful",
        user: {
          id: userId,
          email,
        },
      });
    },
  );
};

export const login = (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM Student_signup WHERE email = ?";

  db.query(sql, [email], async (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Password" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
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
      },
    });
  });
};
