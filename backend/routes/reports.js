import { pool } from "../db.js";
import { authenticate } from "../middleware/authMiddleware.js";

/**
 * Handle all /api/reports routes
 * Supports ?type= query parameter for different report types:
 *   full_inventory, low_stock, stock_summary, product_catalogue,
 *   supplier_directory, stock_movement, category_report, valuation_report
 */
export const handleReportRoutes = async (req, res) => {
    const url = req.url.split("?")[0];

    if (req.method === "GET" && url === "/api/reports/inventory") {
        if (!authenticate(req, res)) return;

        try {
            const params = new URL(req.url, `http://${req.headers.host}`).searchParams;
            const type = params.get("type") || "full_inventory";
            const threshold = parseInt(process.env.LOW_STOCK_THRESHOLD) || 10;

            const report = { generated_at: new Date().toISOString(), low_stock_threshold: threshold };

            // ── Helpers: each query is wrapped in try-catch so a missing
            //    table (e.g. stock_history on a fresh deploy) won't crash
            //    the entire report generation ──
            const safeQuery = async (queryFn) => {
                try {
                    return await queryFn();
                } catch (err) {
                    console.warn("Report sub-query failed (table may not exist):", err.message);
                    return { rows: [] };
                }
            };

            const fetchSummary = async (includeValuation = false) => {
                const base = await safeQuery(() => pool.query(`
                    SELECT 
                        (SELECT COUNT(*)::int FROM products) AS total_products,
                        (SELECT COUNT(*)::int FROM categories) AS total_categories,
                        (SELECT COUNT(*)::int FROM suppliers) AS total_suppliers,
                        (SELECT COALESCE(SUM(quantity), 0)::int FROM products) AS total_stock,
                        (SELECT COUNT(*)::int FROM products WHERE quantity <= $1) AS low_stock_count
                `, [threshold]));
                const summary = base.rows[0] || {
                    total_products: 0,
                    total_categories: 0,
                    total_suppliers: 0,
                    total_stock: 0,
                    low_stock_count: 0,
                };
                if (includeValuation) {
                    const val = await safeQuery(() => pool.query(`SELECT COALESCE(SUM(price * quantity), 0) AS total_valuation FROM products`));
                    summary.total_valuation = val.rows[0]?.total_valuation ?? 0;
                }
                return summary;
            };

            const fetchProducts = () => safeQuery(() => pool.query(`
                SELECT p.id, p.name, p.price, p.quantity,
                       COALESCE(c.name, 'Uncategorized') AS category_name,
                       COALESCE(s.name, 'N/A') AS supplier_name,
                       p.created_at
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN suppliers s ON p.supplier_id = s.id
                ORDER BY c.name, p.name
            `));

            const fetchCategories = () => safeQuery(() => pool.query(`
                SELECT c.id, c.name, c.description,
                       COUNT(p.id)::int AS product_count,
                       COALESCE(SUM(p.quantity), 0)::int AS total_stock
                FROM categories c
                LEFT JOIN products p ON p.category_id = c.id
                GROUP BY c.id, c.name, c.description
                ORDER BY c.name
            `));

            const fetchSuppliers = () => safeQuery(() => pool.query(`
                SELECT s.id, s.name, s.phone, s.email, s.address,
                       COUNT(p.id)::int AS product_count
                FROM suppliers s
                LEFT JOIN products p ON p.supplier_id = s.id
                GROUP BY s.id, s.name, s.phone, s.email, s.address
                ORDER BY s.name
            `));

            const fetchLowStock = () => safeQuery(() => pool.query(`
                SELECT p.name, p.quantity, COALESCE(c.name, 'Uncategorized') AS category_name
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.quantity <= $1
                ORDER BY p.quantity ASC
            `, [threshold]));

            const fetchStockOverview = () => safeQuery(() => pool.query(`
                SELECT COALESCE(c.name, 'Uncategorized') AS category,
                       COUNT(p.id)::int AS product_count,
                       COALESCE(SUM(p.quantity), 0)::int AS total_stock
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                GROUP BY c.name
                ORDER BY total_stock DESC
            `));

            const fetchStockMovements = () => safeQuery(() => pool.query(`
                SELECT sh.change_type, sh.quantity_change, sh.previous_quantity,
                       sh.new_quantity, sh.notes, sh.created_at,
                       p.name AS product_name
                FROM stock_history sh
                JOIN products p ON sh.product_id = p.id
                ORDER BY sh.created_at DESC
                LIMIT 50
            `));

            const fetchValuationByCategory = () => safeQuery(() => pool.query(`
                SELECT COALESCE(c.name, 'Uncategorized') AS category,
                       COUNT(p.id)::int AS product_count,
                       COALESCE(SUM(p.quantity), 0)::int AS total_stock,
                       COALESCE(SUM(p.price * p.quantity), 0) AS total_value
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                GROUP BY c.name
                ORDER BY total_value DESC
            `));

            // ── Build report based on type ──
            switch (type) {
                case "full_inventory": {
                    const [summary, products, categories, suppliers, lowStock, overview, movements] =
                        await Promise.all([
                            fetchSummary(true),
                            fetchProducts(),
                            fetchCategories(),
                            fetchSuppliers(),
                            fetchLowStock(),
                            fetchStockOverview(),
                            fetchStockMovements(),
                        ]);
                    report.summary = summary;
                    report.products = products.rows;
                    report.categories = categories.rows;
                    report.suppliers = suppliers.rows;
                    report.low_stock_items = lowStock.rows;
                    report.stock_overview = overview.rows;
                    report.recent_stock_movements = movements.rows;
                    break;
                }

                case "low_stock": {
                    const [summary, lowStock] = await Promise.all([fetchSummary(), fetchLowStock()]);
                    report.summary = summary;
                    report.low_stock_items = lowStock.rows;
                    break;
                }

                case "stock_summary": {
                    const [summary, overview] = await Promise.all([fetchSummary(), fetchStockOverview()]);
                    report.summary = summary;
                    report.stock_overview = overview.rows;
                    break;
                }

                case "product_catalogue": {
                    const [summary, products] = await Promise.all([fetchSummary(), fetchProducts()]);
                    report.summary = summary;
                    report.products = products.rows;
                    break;
                }

                case "supplier_directory": {
                    const [summary, suppliers] = await Promise.all([fetchSummary(), fetchSuppliers()]);
                    report.summary = summary;
                    report.suppliers = suppliers.rows;
                    break;
                }

                case "stock_movement": {
                    const [summary, movements] = await Promise.all([fetchSummary(), fetchStockMovements()]);
                    report.summary = summary;
                    report.recent_stock_movements = movements.rows;
                    break;
                }

                case "category_report": {
                    const [summary, categories, overview] = await Promise.all([fetchSummary(), fetchCategories(), fetchStockOverview()]);
                    report.summary = summary;
                    report.categories = categories.rows;
                    report.stock_overview = overview.rows;
                    break;
                }

                case "valuation_report": {
                    const [summary, valuation] = await Promise.all([fetchSummary(true), fetchValuationByCategory()]);
                    report.summary = summary;
                    report.valuation_by_category = valuation.rows;
                    break;
                }

                default: {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ message: `Unknown report type: ${type}` }));
                }
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify(report));
        } catch (error) {
            console.error("Report generation error:", error.message, error.stack);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Failed to generate report.", error: error.message }));
        }
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ message: "Report route not found." }));
};
