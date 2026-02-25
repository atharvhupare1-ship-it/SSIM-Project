import { pool } from "./db.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Run database migrations from schema.sql
 * Creates tables if they don't already exist (uses IF NOT EXISTS).
 */
export const runMigrations = async () => {
    try {
        const schemaPath = join(__dirname, "schema.sql");
        const schema = readFileSync(schemaPath, "utf-8");

        console.log("🔄 Running database migrations...");
        await pool.query(schema);
        console.log("✅ Database migrations completed successfully.");

        // Seed data only if products table is empty
        const productCount = await pool.query("SELECT COUNT(*) FROM products");
        if (parseInt(productCount.rows[0].count) === 0) {
            console.log("🌱 Seeding database with initial data...");
            const seedPath = join(__dirname, "seed_data.sql");
            const seedData = readFileSync(seedPath, "utf-8");
            await pool.query(seedData);
            console.log("✅ Seed data loaded successfully.");
        } else {
            console.log("📦 Database already has data, skipping seed.");
        }
    } catch (error) {
        console.error("❌ Migration error:", error.message);
        // Don't crash the server — tables might already exist
    }
};

// Allow running standalone: node migrate.js
if (process.argv[1] && process.argv[1].includes("migrate")) {
    runMigrations().then(() => {
        console.log("Migration script finished.");
        process.exit(0);
    });
}
