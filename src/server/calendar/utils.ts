import "server-only";

/** Google Calendar `EventDateTime` for timed or all-day events. */
export type GoogleCalendarEventTime = {
  date?: string;
  dateTime?: string;
  timeZone?: string;
};

const RFC3339_OFFSET = /(?:[zZ]|[+-]\d{2}:\d{2})$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const LOCAL_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/;

/**
 * Normalize agent/client datetimes for googlecalendar.api.events.create.
 * Bare local strings (no offset) require an explicit timeZone per Google API.
 */
export function toGoogleCalendarEventTime(
  value: string,
  timeZone?: string,
): GoogleCalendarEventTime {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("Event start/end time is required.");
  }

  if (DATE_ONLY.test(trimmed)) {
    return { date: trimmed };
  }

  if (RFC3339_OFFSET.test(trimmed)) {
    return { dateTime: trimmed };
  }

  if (!LOCAL_DATETIME.test(trimmed)) {
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Invalid datetime: ${value}`);
    }
    return { dateTime: parsed.toISOString() };
  }

  const dateTime =
    trimmed.length === 16 ? `${trimmed}:00` : trimmed;

  return {
    dateTime,
    timeZone: timeZone ?? process.env.CALENDAR_TIMEZONE ?? "UTC",
  };
}
