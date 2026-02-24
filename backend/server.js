import http from "http";
import dotenv from "dotenv";
import { handleAuthRoutes } from "./routes/auth.js";
import { handleProductRoutes } from "./routes/products.js";
import { handleCategoryRoutes } from "./routes/categories.js";
import { handleSupplierRoutes } from "./routes/suppliers.js";
import { handleStockRoutes } from "./routes/stock.js";
import { handleDashboardRoutes } from "./routes/dashboard.js";

dotenv.config();

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
    console.log(`🚀 SSIM Server running on http://localhost:${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
});
