const WALL_CLOCK_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;
const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const HAS_OFFSET_RE = /(?:[zZ]|[+-]\d{2}:?\d{2})$/;

type WallClockParts = {
  y: number;
  mo: number;
  d: number;
  h: number;
  mi: number;
};

function parseWallClock(value: string): WallClockParts | null {
  const match = WALL_CLOCK_RE.exec(value.trim());
  if (!match) return null;

  return {
    y: Number(match[1]),
    mo: Number(match[2]),
    d: Number(match[3]),
    h: Number(match[4]),
    mi: Number(match[5]),
  };
}

function parseDateOnly(value: string): WallClockParts | null {
  const match = DATE_ONLY_RE.exec(value.trim());
  if (!match) return null;

  return {
    y: Number(match[1]),
    mo: Number(match[2]),
    d: Number(match[3]),
    h: 0,
    mi: 0,
  };
}

/** Format Y-M-D without timezone conversion (wall-clock date). */
function formatWallClockDate(parts: WallClockParts): string {
  const anchor = new Date(Date.UTC(parts.y, parts.mo - 1, parts.d));
  return anchor.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Format H:M without timezone conversion (wall-clock time). */
function formatWallClockTime(parts: WallClockParts): string {
  const anchor = new Date(Date.UTC(2000, 0, 1, parts.h, parts.mi));
  return anchor.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

function formatWallClockRange(start: string, end: string): string {
  const startParts = parseWallClock(start) ?? parseDateOnly(start);
  const endParts = parseWallClock(end) ?? parseDateOnly(end);
  if (!startParts || !endParts) return `${start} – ${end}`;

  const sameDay =
    startParts.y === endParts.y &&
    startParts.mo === endParts.mo &&
    startParts.d === endParts.d;

  if (parseDateOnly(start) && parseDateOnly(end)) {
    if (sameDay) return formatWallClockDate(startParts);
    return `${formatWallClockDate(startParts)} – ${formatWallClockDate(endParts)}`;
  }

  if (sameDay) {
    return `${formatWallClockDate(startParts)} · ${formatWallClockTime(startParts)} – ${formatWallClockTime(endParts)}`;
  }

  return `${formatWallClockDate(startParts)} ${formatWallClockTime(startParts)} – ${formatWallClockDate(endParts)} ${formatWallClockTime(endParts)}`;
}

function formatInstantRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return `${start} – ${end}`;
  }

  const sameDay =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate();

  const datePart = startDate.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const startTime = startDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const endTime = endDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (sameDay) return `${datePart} · ${startTime} – ${endTime}`;
  return `${datePart} ${startTime} – ${endDate.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })} ${endTime}`;
}

/**
 * Format calendar start/end for agent cards.
 * Bare local datetimes (YYYY-MM-DDTHH:mm:ss) are shown as-is — no Date TZ shift.
 */
export function formatCalendarEventRange(start: string, end: string): string {
  const startTrim = start.trim();
  const endTrim = end.trim();

  if (
    !HAS_OFFSET_RE.test(startTrim) &&
    !HAS_OFFSET_RE.test(endTrim) &&
    (parseWallClock(startTrim) ?? parseDateOnly(startTrim)) &&
    (parseWallClock(endTrim) ?? parseDateOnly(endTrim))
  ) {
    return formatWallClockRange(startTrim, endTrim);
  }

  return formatInstantRange(startTrim, endTrim);
}
