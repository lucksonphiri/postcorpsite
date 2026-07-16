import { neon } from "@neondatabase/serverless";
if (!process.env.DATABASE_URL) console.warn("DATABASE_URL is not configured");
export const sql: any = neon(process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/postcorp");
