import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { Pool } from "@neondatabase/serverless";

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

  if (!databaseUrl || databaseUrl.includes("localhost:5432")) {
    console.log("ℹ️ No remote DATABASE_URL configured. Skipping Neon remote migrations (using built-in dataStore).");
    process.exit(0);
  }

  console.log("🚀 Running Drizzle migrations on Neon PostgreSQL...");
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("✅ Drizzle migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
