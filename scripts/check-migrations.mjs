import postgres from "postgres";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

// Load DATABASE_URL from .env without importing env.js validation
const envText = readFileSync(".env", "utf8");
const match = envText.match(/^DATABASE_URL=(.+)$/m);
if (!match) {
  console.error("DATABASE_URL not found in .env");
  process.exit(1);
}
const url = match[1].trim().replace(/^"|"$/g, "");

const sql = postgres(url);

const migrations = await sql`
  SELECT id, hash, created_at
  FROM drizzle.__drizzle_migrations
  ORDER BY created_at
`;
console.log("Applied migrations:", migrations.length);
for (const row of migrations) {
  console.log(`  #${row.id} ${row.created_at}`);
}

const tables = await sql`
  SELECT tablename
  FROM pg_tables
  WHERE schemaname = 'public'
    AND (tablename LIKE 'MailPilot_%' OR tablename LIKE 'corsair_%')
  ORDER BY tablename
`;
console.log("\nTables in DB:");
for (const row of tables) {
  console.log(`  ${row.tablename}`);
}

const hasAllowlist = tables.some((t) => t.tablename === "MailPilot_agent_allowlist");
console.log(`\nMailPilot_agent_allowlist exists: ${hasAllowlist}`);

await sql.end();
