import { asc, eq, sql } from "drizzle-orm";

import { env } from "@/env";
import { db } from "@/server/db";
import { agentAllowlist, users } from "@/server/db/schema";

export class AgentAccessDeniedError extends Error {
  constructor() {
    super("Agent access is invite-only. Ask an admin to enable it for your account.");
    this.name = "AgentAccessDeniedError";
  }
}

export function normalizeAgentEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function findUserByEmail(email: string) {
  const normalized = normalizeAgentEmail(email);
  return db.query.users.findFirst({
    where: sql`lower(${users.email}) = ${normalized}`,
    columns: { id: true, name: true },
  });
}

export function isAgentAdmin(email: string | null | undefined): boolean {
  const adminEmail = env.AGENT_ADMIN_EMAIL;
  if (!adminEmail || !email) return false;
  return normalizeAgentEmail(email) === normalizeAgentEmail(adminEmail);
}

export async function isAgentAllowed(
  userId: string,
  email: string | null | undefined,
): Promise<boolean> {
  if (!email) return false;
  if (isAgentAdmin(email)) return true;

  const normalized = normalizeAgentEmail(email);
  const row = await db.query.agentAllowlist.findFirst({
    where: eq(agentAllowlist.email, normalized),
    columns: { id: true, userId: true },
  });

  if (!row) return false;

  if (!row.userId) {
    await db
      .update(agentAllowlist)
      .set({ userId })
      .where(eq(agentAllowlist.id, row.id));
  }

  return true;
}

export async function assertAgentAccess(
  userId: string,
  email: string | null | undefined,
): Promise<void> {
  const allowed = await isAgentAllowed(userId, email);
  if (!allowed) {
    throw new AgentAccessDeniedError();
  }
}

export type AgentAllowlistEntry = {
  id: string;
  email: string;
  userId: string | null;
  userName: string | null;
  grantedBy: string;
  createdAt: Date;
};

export async function listAgentAllowlist(): Promise<AgentAllowlistEntry[]> {
  const rows = await db
    .select({
      id: agentAllowlist.id,
      email: agentAllowlist.email,
      userId: agentAllowlist.userId,
      grantedBy: agentAllowlist.grantedBy,
      createdAt: agentAllowlist.createdAt,
      userName: users.name,
    })
    .from(agentAllowlist)
    .leftJoin(users, eq(agentAllowlist.userId, users.id))
    .orderBy(asc(agentAllowlist.createdAt));

  return rows;
}

export async function grantAgentAccess(
  email: string,
  grantedBy: string,
): Promise<AgentAllowlistEntry> {
  const normalized = normalizeAgentEmail(email);
  const existingUser = await findUserByEmail(normalized);

  const [row] = await db
    .insert(agentAllowlist)
    .values({
      email: normalized,
      userId: existingUser?.id ?? null,
      grantedBy: normalizeAgentEmail(grantedBy),
    })
    .onConflictDoUpdate({
      target: agentAllowlist.email,
      set: {
        grantedBy: normalizeAgentEmail(grantedBy),
        userId: existingUser?.id ?? null,
      },
    })
    .returning();

  if (!row) {
    throw new Error("Failed to grant agent access");
  }

  return {
    id: row.id,
    email: row.email,
    userId: row.userId,
    userName: existingUser?.name ?? null,
    grantedBy: row.grantedBy,
    createdAt: row.createdAt,
  };
}

export async function revokeAgentAccess(email: string): Promise<boolean> {
  const normalized = normalizeAgentEmail(email);
  const deleted = await db
    .delete(agentAllowlist)
    .where(eq(agentAllowlist.email, normalized))
    .returning({ id: agentAllowlist.id });

  return deleted.length > 0;
}
