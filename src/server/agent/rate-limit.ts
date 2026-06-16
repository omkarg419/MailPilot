import { and, asc, eq, gte } from "drizzle-orm";

import { db } from "@/server/db";
import { agentUsage } from "@/server/db/schema";

export const AGENT_REQUEST_LIMIT = 5;
const WINDOW_MS = 24 * 60 * 60 * 1000;

export type AgentUsageSnapshot = {
  limit: number;
  used: number;
  remaining: number;
  resetsAt: Date | null;
};

export class AgentRateLimitError extends Error {
  readonly usage: AgentUsageSnapshot;

  constructor(usage: AgentUsageSnapshot) {
    super("Agent rate limit reached");
    this.name = "AgentRateLimitError";
    this.usage = usage;
  }
}

export async function getAgentUsage(userId: string): Promise<AgentUsageSnapshot> {
  const since = new Date(Date.now() - WINDOW_MS);
  const rows = await db
    .select({ createdAt: agentUsage.createdAt })
    .from(agentUsage)
    .where(and(eq(agentUsage.userId, userId), gte(agentUsage.createdAt, since)))
    .orderBy(asc(agentUsage.createdAt));

  const used = rows.length;
  const remaining = Math.max(0, AGENT_REQUEST_LIMIT - used);
  const oldest = rows[0]?.createdAt;
  const resetsAt = oldest ? new Date(oldest.getTime() + WINDOW_MS) : null;

  return {
    limit: AGENT_REQUEST_LIMIT,
    used,
    remaining,
    resetsAt,
  };
}

export async function consumeAgentRequest(
  userId: string,
): Promise<AgentUsageSnapshot> {
  const usage = await getAgentUsage(userId);
  if (usage.remaining <= 0) {
    throw new AgentRateLimitError(usage);
  }

  await db.insert(agentUsage).values({ userId });

  return {
    ...usage,
    used: usage.used + 1,
    remaining: usage.remaining - 1,
  };
}
