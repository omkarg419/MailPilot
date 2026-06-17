import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import postgres from "postgres";

const envText = readFileSync(".env", "utf8");
const match = envText.match(/^DATABASE_URL=(.+)$/m);
if (!match) {
  console.error("DATABASE_URL not found in .env");
  process.exit(1);
}
const url = match[1].trim().replace(/^"|"$/g, "");

function migrationHash(filePath) {
  const content = readFileSync(filePath, "utf8");
  return createHash("sha256").update(content).digest("hex");
}

const sql = postgres(url);

const allowlistExists = await sql`
  SELECT 1
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename = 'MailPilot_agent_allowlist'
  LIMIT 1
`;

if (allowlistExists.length === 0) {
  console.log("Creating MailPilot_agent_allowlist...");
  const ddl = readFileSync("drizzle/0002_agent_allowlist.sql", "utf8");
  const statements = ddl
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await sql.unsafe(statement);
  }
  console.log("Allowlist table created.");
} else {
  console.log("MailPilot_agent_allowlist already exists — skipping DDL.");
}

const journal = JSON.parse(
  readFileSync("drizzle/meta/_journal.json", "utf8"),
).entries;

const applied = await sql`
  SELECT hash, created_at
  FROM drizzle.__drizzle_migrations
  ORDER BY created_at
`;

const appliedWhen = new Set(applied.map((row) => String(row.created_at)));

for (const entry of journal) {
  if (entry.tag === "0003_steep_agent_brand") continue;

  const when = String(entry.when);
  if (appliedWhen.has(when)) {
    console.log(`Migration ${entry.tag} already recorded.`);
    continue;
  }

  const filePath = `drizzle/${entry.tag}.sql`;
  const hash = migrationHash(filePath);
  await sql`
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
    VALUES (${hash}, ${entry.when})
  `;
  console.log(`Recorded migration ${entry.tag}.`);
}

console.log("\nDone. Run: node scripts/check-migrations.mjs");

await sql.end();
