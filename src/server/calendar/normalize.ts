import "server-only";

export type GoogleCalendarApiEvent = {
  id?: string;
  summary?: string;
  description?: string;
  start?: { date?: string; dateTime?: string; timeZone?: string };
  end?: { date?: string; dateTime?: string; timeZone?: string };
  attendees?: { email?: string }[];
};

export type CalendarEventView = {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  attendees?: string[];
  allDay: boolean;
};

export function eventTimeToDisplayString(time?: {
  date?: string;
  dateTime?: string;
}): string {
  if (!time) return "";
  if (time.date) return time.date;
  if (time.dateTime) return time.dateTime;
  return "";
}

export function normalizeCalendarEvent(
  item: GoogleCalendarApiEvent,
): CalendarEventView | null {
  if (!item.id) return null;

  const start = eventTimeToDisplayString(item.start);
  const end = eventTimeToDisplayString(item.end);
  if (!start || !end) return null;

  return {
    id: item.id,
    title: item.summary?.trim() ?? "(No title)",
    start,
    end,
    description: item.description ?? undefined,
    attendees: item.attendees
      ?.map((a) => a.email?.trim())
      .filter((e): e is string => Boolean(e)),
    allDay: Boolean(item.start?.date),
  };
}

export type GoogleEventsListResult = {
  items?: GoogleCalendarApiEvent[];
};
