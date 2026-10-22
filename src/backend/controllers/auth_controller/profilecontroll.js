import db from "../../config/db.js";
import { v4 as uuidv4 } from "uuid";

export const getUserById = (req, res) => {
  const { id } = req.params;

  const sql = "SELECT id, name, username, email, avatar_url, assigned_id, role FROM Student_signup WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.log("DB ERROR:", err);
      return res.status(500).json(err);
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(result[0]);
  });
};



export const Student_Profile = (req, res) => {

  const std_id = uuidv4();

  const {
    user_uid,
    full_name,
    username,
    email,
    dob,
    age,
    cnic,
    gender,
    address
  } = req.body;

  const sql = `
    INSERT INTO Student_Profile 
    (std_id, user_uid, full_name, username, email, dob, age, cnic, gender, address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      std_id,
      user_uid,
      full_name,
      username,
      email,
      dob,
      age,
      cnic,
      gender,
      address
    ],
    (err, result) => {

      if (err) {
        return res.status(500).json({
          message: "DB Error",
          error: err
        });
      }

      return res.status(201).json({
        message: "Student profile created successfully",
        profile: {
          std_id,
          user_uid
        }
      });
    }
  );
};

export const getStudentProfile = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT * FROM Student_Profile
    WHERE user_uid = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.length === 0) {
      return res.status(200).json(null);
    }

    return res.status(200).json(result[0]);
  });
};

export const updateStudentProfile = (req, res) => {
  const {
    user_uid,
    full_name,
    username,
    email,
    dob,
    age,
    cnic,
    gender,
    address
  } = req.body;

  
  const sql1 = `
    UPDATE Student_Profile
    SET full_name=?, username=?, email=?, dob=?, age=?, cnic=?, gender=?, address=?
    WHERE user_uid=?
  `;

 
  const sql2 = `
    UPDATE Student_signup
    SET name=?, username=?, email=?
    WHERE id=?
  `;

  db.query(sql1,
    [full_name, username, email, dob, age, cnic, gender, address, user_uid],
    (err) => {
      if (err) return res.status(500).json(err);

      db.query(sql2,
        [full_name, username, email, user_uid],
        (err2) => {
          if (err2) return res.status(500).json(err2);

          return res.status(200).json({
            message: "Profile + Signup updated successfully"
          });
        }
      );
    }
  );
};