import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test connection automatically
pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL (ssimdb)"))
  .catch(err => console.error("❌ DB Connection Error:", err));