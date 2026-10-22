import db from "../../config/db.js";

export const createUser = (name, username, email, password, callback) => {
  const sql = `
    INSERT INTO Student_signup (name, username, email, password)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [name, username, email, password], callback);
};
