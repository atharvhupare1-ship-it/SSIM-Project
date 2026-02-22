import { pool } from "../db.js";
import { authenticate } from "../middleware/authMiddleware.js";

/**
 * Handle all /api/dashboard routes — aggregated stats for the admin dashboard
 */
export const handleDashboardRoutes = async (req, res) => {
    const url = req.url.split("?")[0];

    // =========================
    // GET /api/dashboard/stats — Summary counts
    // =========================
    if (req.method === "GET" && url === "/api/dashboard/stats") {
        if (!authenticate(req, res)) return;

        try {
            const threshold = parseInt(process.env.LOW_STOCK_THRESHOLD) || 10;

            const [products, categories, suppliers, totalStock, lowStock] = await Promise.all([
                pool.query("SELECT COUNT(*)::int AS count FROM products"),
                pool.query("SELECT COUNT(*)::int AS count FROM categories"),
                pool.query("SELECT COUNT(*)::int AS count FROM suppliers"),
                pool.query("SELECT COALESCE(SUM(quantity), 0)::int AS total FROM products"),
                pool.query("SELECT COUNT(*)::int AS count FROM products WHERE quantity <= $1", [threshold]),
            ]);

            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({
                total_products: products.rows[0].count,
                total_categories: categories.rows[0].count,
                total_suppliers: suppliers.rows[0].count,
                total_stock: totalStock.rows[0].total,
                low_stock_count: lowStock.rows[0].count,
                low_stock_threshold: threshold,
            }));
        } catch (error) {
            console.error("Dashboard stats error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Internal server error." }));
        }
    }

    // =========================
    // GET /api/dashboard/recent — Recently added products
    // =========================
    if (req.method === "GET" && url === "/api/dashboard/recent") {
        if (!authenticate(req, res)) return;

        try {
            const result = await pool.query(
                `SELECT p.id, p.name, p.price, p.quantity, p.created_at, c.name AS category_name
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         ORDER BY p.created_at DESC
         LIMIT 5`
            );

            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ recent_products: result.rows }));
        } catch (error) {
            console.error("Dashboard recent error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Internal server error." }));
        }
    }

    // =========================
    // GET /api/dashboard/stock-overview — Per-category stock totals (for charts)
    // =========================
    if (req.method === "GET" && url === "/api/dashboard/stock-overview") {
        if (!authenticate(req, res)) return;

        try {
            const result = await pool.query(
                `SELECT 
           COALESCE(c.name, 'Uncategorized') AS category,
           COUNT(p.id)::int AS product_count,
           COALESCE(SUM(p.quantity), 0)::int AS total_stock
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         GROUP BY c.name
         ORDER BY total_stock DESC`
            );

            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ stock_overview: result.rows }));
        } catch (error) {
            console.error("Dashboard stock overview error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Internal server error." }));
        }
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ message: "Dashboard route not found." }));
};
