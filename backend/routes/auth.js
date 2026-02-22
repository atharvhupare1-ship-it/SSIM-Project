import { pool } from "../db.js";
import { parseBody } from "../utils/parseBody.js";
import { authenticate } from "../middleware/authMiddleware.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

/**
 * Handle all /api/auth/* routes
 */
export const handleAuthRoutes = async (req, res) => {
  const url = req.url.split("?")[0];

  // =========================
  // POST /api/auth/signup
  // =========================
  if (req.method === "POST" && url === "/api/auth/signup") {
    try {
      const { name, email, password } = await parseBody(req);

      // Validation
      if (!name || !email || !password) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "All fields are required (name, email, password)." }));
      }

      if (password.length < 6) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Password must be at least 6 characters." }));
      }

      // Check duplicate email
      const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
      if (existing.rows.length > 0) {
        res.writeHead(409, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Email already registered." }));
      }

      // Hash password & insert
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        `INSERT INTO users (name, email, password, role) 
         VALUES ($1, $2, $3, 'ADMIN') 
         RETURNING id, name, email, role, created_at`,
        [name, email, hashedPassword]
      );

      const user = result.rows[0];

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.writeHead(201, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        message: "Admin account created successfully.",
        user,
        token,
      }));
    } catch (error) {
      console.error("Signup error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Internal server error." }));
    }
  }

  // =========================
  // POST /api/auth/login
  // =========================
  if (req.method === "POST" && url === "/api/auth/login") {
    try {
      const { email, password } = await parseBody(req);

      if (!email || !password) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Email and password are required." }));
      }

      const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

      if (result.rows.length === 0) {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Invalid email or password." }));
      }

      const user = result.rows[0];
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Invalid email or password." }));
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        message: "Login successful.",
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      }));
    } catch (error) {
      console.error("Login error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Internal server error." }));
    }
  }

  // =========================
  // POST /api/auth/logout
  // =========================
  if (req.method === "POST" && url === "/api/auth/logout") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({
      message: "Logged out successfully. Please discard the token on the client.",
    }));
  }

  // =========================
  // GET /api/auth/profile
  // =========================
  if (req.method === "GET" && url === "/api/auth/profile") {
    if (!authenticate(req, res)) return;

    try {
      const result = await pool.query(
        "SELECT id, name, email, role, created_at FROM users WHERE id = $1",
        [req.user.id]
      );

      if (result.rows.length === 0) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "User not found." }));
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ user: result.rows[0] }));
    } catch (error) {
      console.error("Profile error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Internal server error." }));
    }
  }

  // No matching auth route
  res.writeHead(404, { "Content-Type": "application/json" });
  return res.end(JSON.stringify({ message: "Auth route not found." }));
};