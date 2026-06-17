import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  grantAgentAccess,
  isAgentAdmin,
  isAgentAllowed,
  listAgentAllowlist,
  revokeAgentAccess,
} from "@/server/agent/access";
import {
  AGENT_REQUEST_LIMIT,
  getAgentUsage,
} from "@/server/agent/rate-limit";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  const email = ctx.session.user.email;
  if (!email || !isAgentAdmin(email)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next({
    ctx: {
      ...ctx,
      adminEmail: email,
    },
  });
});

export const agentRouter = createTRPCRouter({
  getAccess: protectedProcedure.query(async ({ ctx }) => {
    const email = ctx.session.user.email ?? "";
    const [allowed, isAdmin] = await Promise.all([
      isAgentAllowed(ctx.session.user.id, email),
      Promise.resolve(isAgentAdmin(email)),
    ]);
    return { allowed, isAdmin };
  }),

  getUsage: protectedProcedure.query(async ({ ctx }) => {
    const email = ctx.session.user.email ?? "";
    const allowed = await isAgentAllowed(ctx.session.user.id, email);
    const isAdmin = isAgentAdmin(email);

    if (!allowed) {
      return {
        allowed: false,
        isAdmin,
        limit: AGENT_REQUEST_LIMIT,
        used: 0,
        remaining: 0,
        resetsAt: null,
      };
    }

    const usage = await getAgentUsage(ctx.session.user.id);
    return {
      allowed: true,
      isAdmin,
      limit: usage.limit,
      used: usage.used,
      remaining: usage.remaining,
      resetsAt: usage.resetsAt,
    };
  }),

  listAllowlist: adminProcedure.query(async () => {
    return listAgentAllowlist();
  }),

  grantAccess: adminProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      return grantAgentAccess(input.email, ctx.adminEmail);
    }),

  revokeAccess: adminProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const revoked = await revokeAgentAccess(input.email);
      if (!revoked) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "That email is not on the allowlist",
        });
      }
      return { success: true as const };
    }),
});
