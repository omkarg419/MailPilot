import "server-only";

import { executeOperation } from "@/server/agent/execute-operation";

import { eventTimeToMs, toGoogleCalendarEventTime } from "./utils";

type CalendarEventItem = {
  summary?: string;
  start?: { date?: string; dateTime?: string; timeZone?: string };
  end?: { date?: string; dateTime?: string; timeZone?: string };
};

type EventsListResult = {
  items?: CalendarEventItem[];
};

function parseEventRange(
  item: CalendarEventItem,
): { startMs: number; endMs: number } | null {
  if (!item.start || !item.end) return null;

  if (item.start.date && item.end.date) {
    const startMs = eventTimeToMs({ date: item.start.date });
    const endMs = eventTimeToMs({ date: item.end.date });
    return startMs !== null && endMs !== null ? { startMs, endMs } : null;
  }

  if (item.start.dateTime && item.end.dateTime) {
    const startMs = eventTimeToMs({
      dateTime: item.start.dateTime,
      timeZone: item.start.timeZone,
    });
    const endMs = eventTimeToMs({
      dateTime: item.end.dateTime,
      timeZone: item.end.timeZone,
    });
    return startMs !== null && endMs !== null ? { startMs, endMs } : null;
  }

  return null;
}

/** Half-open interval overlap: [aStart, aEnd) vs [bStart, bEnd). */
export function intervalsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export type CalendarConflictResult =
  | { conflict: false }
  | { conflict: true; title: string };

export function formatCalendarConflictMessage(existingTitle: string): string {
  return `This time slot is already booked for "${existingTitle}". Please choose a different time.`;
}

export async function findCalendarConflict(
  tenantId: string,
  calendarId: string,
  start: string,
  end: string,
  timeZone?: string,
): Promise<CalendarConflictResult> {
  const eventStart = toGoogleCalendarEventTime(start, timeZone);
  const eventEnd = toGoogleCalendarEventTime(end, timeZone);

  const proposedStartMs = eventTimeToMs(eventStart);
  const proposedEndMs = eventTimeToMs(eventEnd);

  if (proposedStartMs === null || proposedEndMs === null) {
    return { conflict: false };
  }

  if (proposedEndMs <= proposedStartMs) {
    return { conflict: false };
  }

  const timeMin = new Date(proposedStartMs).toISOString();
  const timeMax = new Date(proposedEndMs).toISOString();

  const listResult = await executeOperation(tenantId, {
    plugin: "googlecalendar",
    operation: "api.events.getMany",
    params: {
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
    },
  });

  if (!listResult.ok) {
    throw new Error(listResult.error);
  }

  const items = (listResult.result as EventsListResult)?.items ?? [];

  for (const item of items) {
    const range = parseEventRange(item);
    if (!range) continue;

    if (
      intervalsOverlap(
        proposedStartMs,
        proposedEndMs,
        range.startMs,
        range.endMs,
      )
    ) {
      return {
        conflict: true,
        title: item.summary?.trim() ?? "Existing event",
      };
    }
  }

  return { conflict: false };
}
