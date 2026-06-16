import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { getAgentUsage } from "@/server/agent/rate-limit";

export const agentRouter = createTRPCRouter({
  getUsage: protectedProcedure.query(async ({ ctx }) => {
    const usage = await getAgentUsage(ctx.session.user.id);
    return {
      ...usage,
      resetsAt: usage.resetsAt?.toISOString() ?? null,
    };
  }),
});
