import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// -------------------------------------------------------------
// PostgreSQL Database connection using Drizzle ORM & Postgres.js
// -------------------------------------------------------------
// In a full-stack environment, developers can retrieve the connection
// string from environment variables (e.g., process.env.DATABASE_URL)
// -------------------------------------------------------------

const connectionString = process.env.DATABASE_URL || 'postgres://username:password@localhost:5432/sunpyramids';

// For execution in server-side environments:
const client = postgres(connectionString, { 
  max: 10,                 // Connection pool limit
  idle_timeout: 20,         // Close idle connections after 20s
  connect_timeout: 10,      // Timeout after 10s
});

export const db = drizzle(client, { schema });

// Exported so the server can run raw DDL at startup (CREATE TABLE / ALTER TABLE
// IF NOT EXISTS) — Drizzle does not auto-provision tables, and without them the
// API would silently fall back to in-memory demo data and never persist.
export { client };
