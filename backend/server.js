import http from "http";
import dotenv from "dotenv";
import { handleAuthRoutes } from "./routes/auth.js";
import { handleProductRoutes } from "./routes/products.js";
import { handleCategoryRoutes } from "./routes/categories.js";
import { handleSupplierRoutes } from "./routes/suppliers.js";
import { handleStockRoutes } from "./routes/stock.js";
import { handleDashboardRoutes } from "./routes/dashboard.js";
import { runMigrations } from "./migrate.js";

dotenv.config();

// Run database migrations on startup (creates tables if they don't exist)
await runMigrations();

const PORT = process.env.PORT || 5000;

/**
 * Main HTTP Server
 * Routes requests to the appropriate handler based on URL prefix.
 */
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

const server = http.createServer(async (req, res) => {
    // ========== CORS Headers ==========
    res.setHeader("Access-Control-Allow-Origin", CORS_ORIGIN);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // Handle preflight
    if (req.method === "OPTIONS") {
        res.writeHead(204);
        return res.end();
    }

    // Set default content type
    res.setHeader("Content-Type", "application/json");

    try {
        const url = req.url.split("?")[0];

        // ========== Health Check (Diagnostic) ==========
        if (url === "/api/health") {
            const { pool } = await import("./db.js");
            const checks = {
                server: "ok",
                env: {
                    DATABASE_URL: !!process.env.DATABASE_URL,
                    JWT_SECRET: !!process.env.JWT_SECRET,
                    PORT: process.env.PORT || "not set (using 5000)",
                    NODE_ENV: process.env.NODE_ENV || "not set",
                    CORS_ORIGIN: process.env.CORS_ORIGIN || "not set",
                },
                database: "checking...",
            };

            try {
                const result = await pool.query("SELECT NOW() AS time, current_database() AS db");
                checks.database = {
                    status: "connected",
                    time: result.rows[0].time,
                    name: result.rows[0].db,
                };

                // Check tables and row counts
                const tables = await pool.query(`
                    SELECT table_name FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    ORDER BY table_name
                `);
                checks.tables = {};
                for (const row of tables.rows) {
                    const countRes = await pool.query(`SELECT COUNT(*) FROM "${row.table_name}"`);
                    checks.tables[row.table_name] = parseInt(countRes.rows[0].count);
                }
            } catch (dbErr) {
                checks.database = {
                    status: "error",
                    message: dbErr.message,
                };
            }

            res.writeHead(200);
            return res.end(JSON.stringify(checks, null, 2));
        }

        // ========== Seed Data (One-time) ==========
        if (url === "/api/seed" && req.method === "POST") {
            const { pool } = await import("./db.js");
            const { readFileSync } = await import("fs");
            const { fileURLToPath } = await import("url");
            const { dirname, join } = await import("path");
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = dirname(__filename);

            try {
                const seedPath = join(__dirname, "seed_data.sql");
                const seedData = readFileSync(seedPath, "utf-8");
                await pool.query(seedData);

                // Report what was inserted
                const suppliers = await pool.query("SELECT COUNT(*) FROM suppliers");
                const products = await pool.query("SELECT COUNT(*) FROM products");
                const categories = await pool.query("SELECT COUNT(*) FROM categories");

                res.writeHead(200);
                return res.end(JSON.stringify({
                    message: "Seed data loaded successfully.",
                    counts: {
                        categories: parseInt(categories.rows[0].count),
                        suppliers: parseInt(suppliers.rows[0].count),
                        products: parseInt(products.rows[0].count),
                    }
                }, null, 2));
            } catch (seedErr) {
                res.writeHead(500);
                return res.end(JSON.stringify({
                    message: "Seed failed.",
                    error: seedErr.message,
                    detail: seedErr.detail || null,
                }, null, 2));
            }
        }

        // ========== Route Dispatcher ==========
        if (url.startsWith("/api/auth")) {
            return await handleAuthRoutes(req, res);
        }

        if (url.startsWith("/api/dashboard")) {
            return await handleDashboardRoutes(req, res);
        }

        if (url.startsWith("/api/products")) {
            return await handleProductRoutes(req, res);
        }

        if (url.startsWith("/api/categories")) {
            return await handleCategoryRoutes(req, res);
        }

        if (url.startsWith("/api/suppliers")) {
            return await handleSupplierRoutes(req, res);
        }

        if (url.startsWith("/api/stock")) {
            return await handleStockRoutes(req, res);
        }

        // ========== 404 Fallback ==========
        res.writeHead(404);
        return res.end(JSON.stringify({ message: "Route not found." }));

    } catch (error) {
        console.error("Unhandled server error:", error);
        if (!res.headersSent) {
            res.writeHead(500);
            res.end(JSON.stringify({ message: "Internal server error." }));
        }
    }
});

server.listen(PORT, () => {
    console.log(`🚀 SSIM Server running on ${PORT}`);
});
