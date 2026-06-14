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

/** UTC epoch ms for overlap checks. All-day `date` uses start-of-day UTC. */
export function eventTimeToMs(time: GoogleCalendarEventTime): number | null {
  if (time.date) {
    const ms = Date.parse(`${time.date}T00:00:00.000Z`);
    return Number.isNaN(ms) ? null : ms;
  }

  if (!time.dateTime) return null;

  if (RFC3339_OFFSET.test(time.dateTime)) {
    const ms = Date.parse(time.dateTime);
    return Number.isNaN(ms) ? null : ms;
  }

  if (time.timeZone) {
    return localDateTimeInZoneToUtcMs(time.dateTime, time.timeZone);
  }

  const ms = Date.parse(time.dateTime);
  return Number.isNaN(ms) ? null : ms;
}

function localDateTimeInZoneToUtcMs(local: string, timeZone: string): number {
  const normalized = local.length === 16 ? `${local}:00` : local;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/.exec(normalized);
  if (!match) {
    const ms = Date.parse(normalized);
    return Number.isNaN(ms) ? 0 : ms;
  }

  const target = normalized;
  let guess = Date.parse(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z`);

  for (let i = 0; i < 4; i++) {
    const formatted = new Intl.DateTimeFormat("sv-SE", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .format(new Date(guess))
      .replace(" ", "T");

    if (formatted === target) return guess;

    const targetMs = Date.parse(`${target}Z`);
    const formattedMs = Date.parse(`${formatted}Z`);
    guess += targetMs - formattedMs;
  }

  return guess;
}
