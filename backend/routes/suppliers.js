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
 * Handle all /api/suppliers routes
 */
export const handleSupplierRoutes = async (req, res) => {
    const url = req.url.split("?")[0];

    // =========================
    // GET /api/suppliers — List all suppliers
    // =========================
    if (req.method === "GET" && url === "/api/suppliers") {
        if (!authenticate(req, res)) return;

        try {
            const result = await pool.query(
                `SELECT s.*, COUNT(p.id)::int AS product_count
         FROM suppliers s
         LEFT JOIN products p ON p.supplier_id = s.id
         GROUP BY s.id
         ORDER BY s.name ASC`
            );

            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ suppliers: result.rows }));
        } catch (error) {
            console.error("List suppliers error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Internal server error." }));
        }
    }

    // =========================
    // GET /api/suppliers/:id
    // =========================
    if (req.method === "GET" && url.startsWith("/api/suppliers/")) {
        if (!authenticate(req, res)) return;

        const id = extractId(req.url, "/api/suppliers/");

        try {
            const supplier = await pool.query("SELECT * FROM suppliers WHERE id = $1", [id]);

            if (supplier.rows.length === 0) {
                res.writeHead(404, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ message: "Supplier not found." }));
            }

            // Get products supplied by this supplier
            const products = await pool.query(
                "SELECT id, name, price, quantity FROM products WHERE supplier_id = $1 ORDER BY name",
                [id]
            );

            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({
                supplier: supplier.rows[0],
                products: products.rows,
            }));
        } catch (error) {
            console.error("Get supplier error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Internal server error." }));
        }
    }

    // =========================
    // POST /api/suppliers — Create (Admin only)
    // =========================
    if (req.method === "POST" && url === "/api/suppliers") {
        if (!authenticate(req, res)) return;
        if (!authorizeAdmin(req, res)) return;

        try {
            const { name, phone, email, address } = await parseBody(req);

            if (!name) {
                res.writeHead(400, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ message: "Supplier name is required." }));
            }

            const result = await pool.query(
                `INSERT INTO suppliers (name, phone, email, address) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
                [name, phone || null, email || null, address || null]
            );

            res.writeHead(201, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({
                message: "Supplier created successfully.",
                supplier: result.rows[0],
            }));
        } catch (error) {
            console.error("Create supplier error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Internal server error." }));
        }
    }

    // =========================
    // PUT /api/suppliers/:id — Update (Admin only)
    // =========================
    if (req.method === "PUT" && url.startsWith("/api/suppliers/")) {
        if (!authenticate(req, res)) return;
        if (!authorizeAdmin(req, res)) return;

        const id = extractId(req.url, "/api/suppliers/");

        try {
            const { name, phone, email, address } = await parseBody(req);

            const result = await pool.query(
                `UPDATE suppliers 
         SET name = COALESCE($1, name),
             phone = COALESCE($2, phone),
             email = COALESCE($3, email),
             address = COALESCE($4, address),
             updated_at = NOW()
         WHERE id = $5 RETURNING *`,
                [name, phone, email, address, id]
            );

            if (result.rows.length === 0) {
                res.writeHead(404, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ message: "Supplier not found." }));
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({
                message: "Supplier updated successfully.",
                supplier: result.rows[0],
            }));
        } catch (error) {
            console.error("Update supplier error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Internal server error." }));
        }
    }

    // =========================
    // DELETE /api/suppliers/:id — Delete (Admin only)
    // =========================
    if (req.method === "DELETE" && url.startsWith("/api/suppliers/")) {
        if (!authenticate(req, res)) return;
        if (!authorizeAdmin(req, res)) return;

        const id = extractId(req.url, "/api/suppliers/");

        try {
            const result = await pool.query(
                "DELETE FROM suppliers WHERE id = $1 RETURNING id, name",
                [id]
            );

            if (result.rows.length === 0) {
                res.writeHead(404, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ message: "Supplier not found." }));
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({
                message: "Supplier deleted successfully.",
                deleted: result.rows[0],
            }));
        } catch (error) {
            console.error("Delete supplier error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Internal server error." }));
        }
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ message: "Supplier route not found." }));
};
