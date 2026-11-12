import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const connectionConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "uni_finder",
  dateStrings: true,
};

const db = mysql.createConnection(connectionConfig);

export const createTransactionConnection = () => mysql.createConnection(connectionConfig);

export const dbReady = new Promise((resolve, reject) => {
  db.connect((err) => {
    if (err) {
      console.error("DB Connection Failed:", err.message);
      process.exit(1);
      return reject(err);
    }
    console.log("MySQL Connected Successfully");
    resolve();
  });
});

export default db;