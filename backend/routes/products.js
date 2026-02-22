import { pool } from "../db.js";
import { parseBody } from "../utils/parseBody.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeAdmin } from "../middleware/roleMiddleware.js";

/**
 * Extract URL params like /api/products/:id
 */
const extractId = (url, prefix) => {
    const clean = url.split("?")[0];
    const parts = clean.replace(prefix, "").split("/").filter(Boolean);
    return parts[0] || null;
};

/**
 * Parse query string into object
 */
const parseQuery = (url) => {
    const qIndex = url.indexOf("?");
    if (qIndex === -1) return {};
    const params = new URLSearchParams(url.substring(qIndex));
    return Object.fromEntries(params.entries());
};

/**
 * Handle all /api/products routes
 */
export const handleProductRoutes = async (req, res) => {
    const url = req.url.split("?")[0];
    const query = parseQuery(req.url);

    // =========================
    // GET /api/products — List all products (with search & filter)
    // =========================
    if (req.method === "GET" && url === "/api/products") {
        if (!authenticate(req, res)) return;

        try {
            let sql = `
        SELECT p.*, 
               c.name AS category_name, 
               s.name AS supplier_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE 1=1
      `;
            const params = [];
            let paramIndex = 1;

            // Search by name
            if (query.search) {
                sql += ` AND p.name ILIKE $${paramIndex}`;
                params.push(`%${query.search}%`);
                paramIndex++;
            }

            // Filter by category
            if (query.category_id) {
                sql += ` AND p.category_id = $${paramIndex}`;
                params.push(query.category_id);
                paramIndex++;
            }

            sql += " ORDER BY p.created_at DESC";

            // Pagination
            const page = parseInt(query.page) || 1;
            const limit = parseInt(query.limit) || 20;
            const offset = (page - 1) * limit;

            sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(limit, offset);

            const result = await pool.query(sql, params);

            // Get total count for pagination
            let countSql = "SELECT COUNT(*) FROM products WHERE 1=1";
            const countParams = [];
            let cIdx = 1;

            if (query.search) {
                countSql += ` AND name ILIKE $${cIdx}`;
                countParams.push(`%${query.search}%`);
                cIdx++;
            }
            if (query.category_id) {
                countSql += ` AND category_id = $${cIdx}`;
                countParams.push(query.category_id);
                cIdx++;
            }

            const countResult = await pool.query(countSql, countParams);
            const total = parseInt(countResult.rows[0].count);

            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({
                products: result.rows,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            }));
        } catch (error) {
            console.error("List products error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Internal server error." }));
        }
    }

    // =========================
    // GET /api/products/:id — Single product
    // =========================
    if (req.method === "GET" && url.startsWith("/api/products/")) {
        if (!authenticate(req, res)) return;

        const id = extractId(req.url, "/api/products/");
        if (!id) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Product ID is required." }));
        }

        try {
            const result = await pool.query(
                `SELECT p.*, c.name AS category_name, s.name AS supplier_name
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         LEFT JOIN suppliers s ON p.supplier_id = s.id
         WHERE p.id = $1`,
                [id]
            );

            if (result.rows.length === 0) {
                res.writeHead(404, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ message: "Product not found." }));
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ product: result.rows[0] }));
        } catch (error) {
            console.error("Get product error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Internal server error." }));
        }
    }

    // =========================
    // POST /api/products — Create product (Admin only)
    // =========================
    if (req.method === "POST" && url === "/api/products") {
        if (!authenticate(req, res)) return;
        if (!authorizeAdmin(req, res)) return;

        try {
            const { name, category_id, price, quantity, supplier_id, image_url } = await parseBody(req);

            if (!name || price === undefined) {
                res.writeHead(400, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ message: "Product name and price are required." }));
            }

            const result = await pool.query(
                `INSERT INTO products (name, category_id, price, quantity, supplier_id, image_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
                [name, category_id || null, price, quantity || 0, supplier_id || null, image_url || null]
            );

            res.writeHead(201, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({
                message: "Product created successfully.",
                product: result.rows[0],
            }));
        } catch (error) {
            console.error("Create product error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Internal server error." }));
        }
    }

    // =========================
    // PUT /api/products/:id — Update product (Admin only)
    // =========================
    if (req.method === "PUT" && url.startsWith("/api/products/")) {
        if (!authenticate(req, res)) return;
        if (!authorizeAdmin(req, res)) return;

        const id = extractId(req.url, "/api/products/");

        try {
            const { name, category_id, price, quantity, supplier_id, image_url } = await parseBody(req);

            const result = await pool.query(
                `UPDATE products 
         SET name = COALESCE($1, name),
             category_id = $2,
             price = COALESCE($3, price),
             quantity = COALESCE($4, quantity),
             supplier_id = $5,
             image_url = COALESCE($6, image_url),
             updated_at = NOW()
         WHERE id = $7
         RETURNING *`,
                [name, category_id || null, price, quantity, supplier_id || null, image_url, id]
            );

            if (result.rows.length === 0) {
                res.writeHead(404, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ message: "Product not found." }));
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({
                message: "Product updated successfully.",
                product: result.rows[0],
            }));
        } catch (error) {
            console.error("Update product error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Internal server error." }));
        }
    }

    // =========================
    // DELETE /api/products/:id — Delete product (Admin only)
    // =========================
    if (req.method === "DELETE" && url.startsWith("/api/products/")) {
        if (!authenticate(req, res)) return;
        if (!authorizeAdmin(req, res)) return;

        const id = extractId(req.url, "/api/products/");

        try {
            const result = await pool.query("DELETE FROM products WHERE id = $1 RETURNING id, name", [id]);

            if (result.rows.length === 0) {
                res.writeHead(404, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ message: "Product not found." }));
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({
                message: "Product deleted successfully.",
                deleted: result.rows[0],
            }));
        } catch (error) {
            console.error("Delete product error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Internal server error." }));
        }
    }

    // No matching product route
    res.writeHead(404, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ message: "Product route not found." }));
};
