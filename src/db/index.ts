import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

let dbInstance: any = null;

export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && !databaseUrl.includes("localhost:5432")) {
    try {
      const pool = new Pool({ connectionString: databaseUrl });
      dbInstance = drizzle(pool, { schema });
      return dbInstance;
    } catch (err) {
      console.warn("Failed to connect to Neon PostgreSQL, falling back to local store", err);
    }
  }

  return null;
}

export const schemaExport = schema;
