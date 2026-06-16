import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  findCalendarConflict,
  formatCalendarConflictMessage,
} from "@/server/calendar/conflicts";
import {
  normalizeCalendarEvent,
  type GoogleEventsListResult,
} from "@/server/calendar/normalize";
import { toGoogleCalendarEventTime } from "@/server/calendar/utils";
import { corsair } from "@/server/corsair";

export type { CalendarEventView } from "@/server/calendar/normalize";

function calendarFor(userId: string) {
  return corsair.withTenant(userId).googlecalendar;
}

function wrapError(err: unknown, action: string): never {
  const message = err instanceof Error ? err.message : "Unknown error";
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: `Calendar ${action} failed: ${message}`,
    cause: err,
  });
}

const eventInputFields = {
  title: z.string().min(1),
  start: z.string().min(1),
  end: z.string().min(1),
  description: z.string().optional(),
  attendees: z.array(z.string().email()).optional(),
  timeZone: z.string().optional(),
  calendarId: z.string().optional(),
};

export const calendarRouter = createTRPCRouter({
  listEvents: protectedProcedure
    .input(
      z.object({
        timeMin: z.string().min(1),
        timeMax: z.string().min(1),
        calendarId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const calendarId = input.calendarId ?? "primary";
      try {
        const result = await calendarFor(ctx.session.user.id).api.events.getMany({
          calendarId,
          timeMin: input.timeMin,
          timeMax: input.timeMax,
          singleEvents: true,
          orderBy: "startTime",
        });
        const items = (result as GoogleEventsListResult)?.items ?? [];
        return items
          .map(normalizeCalendarEvent)
          .filter((e): e is NonNullable<typeof e> => e !== null);
      } catch (err) {
        wrapError(err, "listEvents");
      }
    }),

  createEvent: protectedProcedure
    .input(z.object(eventInputFields))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.id;
      const calendarId = input.calendarId ?? "primary";

      const conflict = await findCalendarConflict(
        tenantId,
        calendarId,
        input.start,
        input.end,
        input.timeZone,
      );
      if (conflict.conflict) {
        throw new TRPCError({
          code: "CONFLICT",
          message: formatCalendarConflictMessage(conflict.title),
        });
      }

      const eventStart = toGoogleCalendarEventTime(input.start, input.timeZone);
      const eventEnd = toGoogleCalendarEventTime(input.end, input.timeZone);
      const attendees = input.attendees?.map((email) => ({ email }));

      try {
        const result = await calendarFor(tenantId).api.events.create({
          calendarId,
          event: {
            summary: input.title,
            description: input.description ?? "",
            start: eventStart,
            end: eventEnd,
            ...(attendees?.length ? { attendees } : {}),
          },
        });
        const normalized = normalizeCalendarEvent(result);
        if (!normalized) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Event created but response could not be parsed.",
          });
        }
        return normalized;
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        wrapError(err, "createEvent");
      }
    }),

  updateEvent: protectedProcedure
    .input(
      z.object({
        eventId: z.string().min(1),
        title: z.string().min(1).optional(),
        start: z.string().min(1).optional(),
        end: z.string().min(1).optional(),
        description: z.string().optional(),
        attendees: z.array(z.string().email()).optional(),
        timeZone: z.string().optional(),
        calendarId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.id;
      const calendarId = input.calendarId ?? "primary";

      if (input.start && input.end) {
        const conflict = await findCalendarConflict(
          tenantId,
          calendarId,
          input.start,
          input.end,
          input.timeZone,
          input.eventId,
        );
        if (conflict.conflict) {
          throw new TRPCError({
            code: "CONFLICT",
            message: formatCalendarConflictMessage(conflict.title),
          });
        }
      }

      const event: Record<string, unknown> = {};
      if (input.title !== undefined) event.summary = input.title;
      if (input.description !== undefined) event.description = input.description;
      if (input.start !== undefined) {
        event.start = toGoogleCalendarEventTime(input.start, input.timeZone);
      }
      if (input.end !== undefined) {
        event.end = toGoogleCalendarEventTime(input.end, input.timeZone);
      }
      if (input.attendees !== undefined) {
        event.attendees = input.attendees.map((email) => ({ email }));
      }

      try {
        const result = await calendarFor(tenantId).api.events.update({
          calendarId,
          id: input.eventId,
          event,
        });
        const normalized = normalizeCalendarEvent(result);
        if (!normalized) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Event updated but response could not be parsed.",
          });
        }
        return normalized;
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        wrapError(err, "updateEvent");
      }
    }),

  deleteEvent: protectedProcedure
    .input(
      z.object({
        eventId: z.string().min(1),
        calendarId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.id;
      const calendarId = input.calendarId ?? "primary";

      try {
        await calendarFor(tenantId).api.events.delete({
          calendarId,
          id: input.eventId,
        });
        return { success: true as const };
      } catch (err) {
        wrapError(err, "deleteEvent");
      }
    }),

  refreshWatch: protectedProcedure.mutation(async ({ ctx }) => {
    const { setupCalendarWatch } = await import("@/server/calendar/watch");
    try {
      const result = await setupCalendarWatch(ctx.session.user.id);
      if (!result) {
        return {
          success: false as const,
          message: "APP_URL is not configured.",
        };
      }
      return {
        success: true as const,
        expiration: result.expiration,
        channelId: result.channelId,
      };
    } catch (err) {
      wrapError(err, "refreshWatch");
    }
  }),
});
