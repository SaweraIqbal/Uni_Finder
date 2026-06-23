import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "uni_finder",


  dateStrings: true,
});

db.connect((err) => {
  if (err) {
    console.log("❌ DB Connection Failed:", err.message);


    process.exit(1);
  } else {
    console.log("✅ MySQL Connected Successfully");
  }
});

export default db;