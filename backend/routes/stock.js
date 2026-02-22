import { pool } from "../db.js";
import { parseBody } from "../utils/parseBody.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeAdmin } from "../middleware/roleMiddleware.js";

const parseQuery = (url) => {
    const qIndex = url.indexOf("?");
    if (qIndex === -1) return {};
    const params = new URLSearchParams(url.substring(qIndex));
    return Object.fromEntries(params.entries());
};

/**
 * Handle all /api/stock routes
 */
export const handleStockRoutes = async (req, res) => {
    const url = req.url.split("?")[0];
    const query = parseQuery(req.url);

    // =========================
    // POST /api/stock/increase — Add stock
    // =========================
    if (req.method === "POST" && url === "/api/stock/increase") {
        if (!authenticate(req, res)) return;
        if (!authorizeAdmin(req, res)) return;

        try {
            const { product_id, quantity, notes } = await parseBody(req);

            if (!product_id || !quantity || quantity <= 0) {
                res.writeHead(400, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ message: "Valid product_id and positive quantity are required." }));
            }

            // Get current product quantity
            const product = await pool.query("SELECT id, name, quantity FROM products WHERE id = $1", [product_id]);

            if (product.rows.length === 0) {
                res.writeHead(404, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ message: "Product not found." }));
            }

            const previousQty = product.rows[0].quantity;
            const newQty = previousQty + quantity;

            // Update product quantity
            await pool.query("UPDATE products SET quantity = $1, updated_at = NOW() WHERE id = $2", [newQty, product_id]);

            // Record in stock history
            await pool.query(
                `INSERT INTO stock_history (product_id, change_type, quantity_change, previous_quantity, new_quantity, notes)
         VALUES ($1, 'IN', $2, $3, $4, $5)`,
                [product_id, quantity, previousQty, newQty, notes || null]
            );

            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({
                message: `Stock increased. ${product.rows[0].name}: ${previousQty} → ${newQty}`,
                product_id,
                previous_quantity: previousQty,
                new_quantity: newQty,
            }));
        } catch (error) {
            console.error("Increase stock error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Internal server error." }));
        }
    }

    // =========================
    // POST /api/stock/decrease — Remove stock
    // =========================
    if (req.method === "POST" && url === "/api/stock/decrease") {
        if (!authenticate(req, res)) return;
        if (!authorizeAdmin(req, res)) return;

        try {
            const { product_id, quantity, notes } = await parseBody(req);

            if (!product_id || !quantity || quantity <= 0) {
                res.writeHead(400, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ message: "Valid product_id and positive quantity are required." }));
            }

            const product = await pool.query("SELECT id, name, quantity FROM products WHERE id = $1", [product_id]);

            if (product.rows.length === 0) {
                res.writeHead(404, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ message: "Product not found." }));
            }

            const previousQty = product.rows[0].quantity;

            if (quantity > previousQty) {
                res.writeHead(400, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({
                    message: `Cannot decrease by ${quantity}. Current stock is ${previousQty}.`,
                }));
            }

            const newQty = previousQty - quantity;

            await pool.query("UPDATE products SET quantity = $1, updated_at = NOW() WHERE id = $2", [newQty, product_id]);

            await pool.query(
                `INSERT INTO stock_history (product_id, change_type, quantity_change, previous_quantity, new_quantity, notes)
         VALUES ($1, 'OUT', $2, $3, $4, $5)`,
                [product_id, quantity, previousQty, newQty, notes || null]
            );

            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({
                message: `Stock decreased. ${product.rows[0].name}: ${previousQty} → ${newQty}`,
                product_id,
                previous_quantity: previousQty,
                new_quantity: newQty,
            }));
        } catch (error) {
            console.error("Decrease stock error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Internal server error." }));
        }
    }

    // =========================
    // GET /api/stock/history — Stock change log
    // =========================
    if (req.method === "GET" && url === "/api/stock/history") {
        if (!authenticate(req, res)) return;

        try {
            let sql = `
        SELECT sh.*, p.name AS product_name
        FROM stock_history sh
        JOIN products p ON sh.product_id = p.id
        WHERE 1=1
      `;
            const params = [];
            let idx = 1;

            if (query.product_id) {
                sql += ` AND sh.product_id = $${idx}`;
                params.push(query.product_id);
                idx++;
            }

            sql += " ORDER BY sh.created_at DESC";

            const page = parseInt(query.page) || 1;
            const limit = parseInt(query.limit) || 25;
            const offset = (page - 1) * limit;
            sql += ` LIMIT $${idx} OFFSET $${idx + 1}`;
            params.push(limit, offset);

            const result = await pool.query(sql, params);

            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ history: result.rows, page, limit }));
        } catch (error) {
            console.error("Stock history error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Internal server error." }));
        }
    }

    // =========================
    // GET /api/stock/low — Low stock products
    // =========================
    if (req.method === "GET" && url === "/api/stock/low") {
        if (!authenticate(req, res)) return;

        try {
            const threshold = parseInt(query.threshold) || parseInt(process.env.LOW_STOCK_THRESHOLD) || 10;

            const result = await pool.query(
                `SELECT p.*, c.name AS category_name
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.quantity <= $1
         ORDER BY p.quantity ASC`,
                [threshold]
            );

            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({
                threshold,
                count: result.rows.length,
                products: result.rows,
            }));
        } catch (error) {
            console.error("Low stock error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Internal server error." }));
        }
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ message: "Stock route not found." }));
};
