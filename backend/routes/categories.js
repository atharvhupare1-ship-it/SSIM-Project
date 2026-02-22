import { pool } from "../db.js";
import { parseBody } from "../utils/parseBody.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeAdmin } from "../middleware/roleMiddleware.js";

const extractId = (url, prefix) => {
    const clean = url.split("?")[0];
    const parts = clean.replace(prefix, "").split("/").filter(Boolean);
    return parts[0] || null;
};

/**
 * Handle all /api/categories routes
 */
export const handleCategoryRoutes = async (req, res) => {
    const url = req.url.split("?")[0];

    // =========================
    // GET /api/categories — List all categories
    // =========================
    if (req.method === "GET" && url === "/api/categories") {
        if (!authenticate(req, res)) return;

        try {
            const result = await pool.query(
                `SELECT c.*, COUNT(p.id)::int AS product_count
         FROM categories c
         LEFT JOIN products p ON p.category_id = c.id
         GROUP BY c.id
         ORDER BY c.name ASC`
            );

            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ categories: result.rows }));
        } catch (error) {
            console.error("List categories error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Internal server error." }));
        }
    }

    // =========================
    // GET /api/categories/:id
    // =========================
    if (req.method === "GET" && url.startsWith("/api/categories/")) {
        if (!authenticate(req, res)) return;

        const id = extractId(req.url, "/api/categories/");

        try {
            const result = await pool.query("SELECT * FROM categories WHERE id = $1", [id]);

            if (result.rows.length === 0) {
                res.writeHead(404, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ message: "Category not found." }));
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ category: result.rows[0] }));
        } catch (error) {
            console.error("Get category error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Internal server error." }));
        }
    }

    // =========================
    // POST /api/categories — Create (Admin only)
    // =========================
    if (req.method === "POST" && url === "/api/categories") {
        if (!authenticate(req, res)) return;
        if (!authorizeAdmin(req, res)) return;

        try {
            const { name, description } = await parseBody(req);

            if (!name) {
                res.writeHead(400, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ message: "Category name is required." }));
            }

            const result = await pool.query(
                "INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *",
                [name, description || null]
            );

            res.writeHead(201, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({
                message: "Category created successfully.",
                category: result.rows[0],
            }));
        } catch (error) {
            if (error.code === "23505") {
                res.writeHead(409, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ message: "Category name already exists." }));
            }
            console.error("Create category error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Internal server error." }));
        }
    }

    // =========================
    // PUT /api/categories/:id — Update (Admin only)
    // =========================
    if (req.method === "PUT" && url.startsWith("/api/categories/")) {
        if (!authenticate(req, res)) return;
        if (!authorizeAdmin(req, res)) return;

        const id = extractId(req.url, "/api/categories/");

        try {
            const { name, description } = await parseBody(req);

            const result = await pool.query(
                `UPDATE categories 
         SET name = COALESCE($1, name), 
             description = COALESCE($2, description),
             updated_at = NOW()
         WHERE id = $3 RETURNING *`,
                [name, description, id]
            );

            if (result.rows.length === 0) {
                res.writeHead(404, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ message: "Category not found." }));
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({
                message: "Category updated successfully.",
                category: result.rows[0],
            }));
        } catch (error) {
            if (error.code === "23505") {
                res.writeHead(409, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ message: "Category name already exists." }));
            }
            console.error("Update category error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Internal server error." }));
        }
    }

    // =========================
    // DELETE /api/categories/:id — Delete (Admin only)
    // =========================
    if (req.method === "DELETE" && url.startsWith("/api/categories/")) {
        if (!authenticate(req, res)) return;
        if (!authorizeAdmin(req, res)) return;

        const id = extractId(req.url, "/api/categories/");

        try {
            const result = await pool.query(
                "DELETE FROM categories WHERE id = $1 RETURNING id, name",
                [id]
            );

            if (result.rows.length === 0) {
                res.writeHead(404, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ message: "Category not found." }));
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({
                message: "Category deleted successfully.",
                deleted: result.rows[0],
            }));
        } catch (error) {
            console.error("Delete category error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Internal server error." }));
        }
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ message: "Category route not found." }));
};
