import type { CalendarEventView } from "@/server/api/routers/calendar";

/** Visible hours in the week grid (inclusive start, exclusive end). */
export const GRID_START_HOUR = 5;
export const GRID_END_HOUR = 23;
export const PX_PER_MINUTE = 1.2;
export const HOUR_HEIGHT_PX = 60 * PX_PER_MINUTE;
export const GRID_HEIGHT_PX = (GRID_END_HOUR - GRID_START_HOUR) * HOUR_HEIGHT_PX;
export const SNAP_MINUTES = 15;

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const WALL_CLOCK_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;
const HAS_OFFSET_RE = /(?:[zZ]|[+-]\d{2}:?\d{2})$/;

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function dayKey(date: Date): string {
  return date.toLocaleDateString("en-CA");
}

export function isSameDay(a: Date, b: Date): boolean {
  return dayKey(a) === dayKey(b);
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function formatHourLabel(hour: number): string {
  const anchor = new Date(2000, 0, 1, hour, 0);
  return anchor.toLocaleTimeString(undefined, {
    hour: "numeric",
    hour12: true,
  });
}

export function formatEventTimeShort(start: string, end: string, allDay: boolean): string {
  if (allDay) return "All day";
  const startDate = parseEventInstant(start, false);
  const endDate = parseEventInstant(end, false);
  if (!startDate || !endDate) return "";
  const fmt = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${fmt(startDate)} – ${fmt(endDate)}`;
}

/** Ultra-compact range for small grid blocks, e.g. "3–3:30p". */
export function formatEventTimeCompact(start: string, end: string, allDay: boolean): string {
  if (allDay) return "All day";
  const startDate = parseEventInstant(start, false);
  const endDate = parseEventInstant(end, false);
  if (!startDate || !endDate) return "";

  const meridian = (d: Date) => (d.getHours() < 12 ? "a" : "p");
  const clock = (d: Date, withMeridian: boolean) => {
    const h = d.getHours() % 12 || 12;
    const m = d.getMinutes();
    const time = m === 0 ? `${h}` : `${h}:${String(m).padStart(2, "0")}`;
    return withMeridian ? `${time}${meridian(d)}` : time;
  };

  const sameMeridian = meridian(startDate) === meridian(endDate);
  return `${clock(startDate, !sameMeridian)}–${clock(endDate, true)}`;
}

/** Parse API datetime into a local Date for grid math. */
export function parseEventInstant(value: string, allDay: boolean): Date | null {
  const trimmed = value.trim();
  if (allDay || DATE_ONLY_RE.test(trimmed)) {
    const d = new Date(`${trimmed.slice(0, 10)}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (!HAS_OFFSET_RE.test(trimmed) && WALL_CLOCK_RE.test(trimmed)) {
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export type TimedSegment = {
  event: CalendarEventView;
  startMs: number;
  endMs: number;
};

/** Clip a timed event to a single calendar day column. */
export function segmentForDay(
  event: CalendarEventView,
  day: Date,
): TimedSegment | null {
  if (event.allDay) return null;

  const eventStart = parseEventInstant(event.start, false);
  const eventEnd = parseEventInstant(event.end, false);
  if (!eventStart || !eventEnd) return null;

  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);
  const startMs = Math.max(eventStart.getTime(), dayStart.getTime());
  const endMs = Math.min(eventEnd.getTime(), dayEnd.getTime());
  if (endMs <= startMs) return null;

  return { event, startMs, endMs };
}

export function msToGridTop(ms: number, day: Date): number {
  const d = new Date(ms);
  if (!isSameDay(d, day)) return 0;
  const mins = minutesSinceMidnight(d) - GRID_START_HOUR * 60;
  return Math.max(0, mins * PX_PER_MINUTE);
}

export function msToGridHeight(startMs: number, endMs: number, day: Date): number {
  const top = msToGridTop(startMs, day);
  const endDate = new Date(endMs);
  const endMins = isSameDay(endDate, day)
    ? minutesSinceMidnight(endDate) - GRID_START_HOUR * 60
    : (GRID_END_HOUR - GRID_START_HOUR) * 60;
  const height = endMins * PX_PER_MINUTE - top;
  return Math.max(height, 20);
}

export type GridEventLayout = {
  event: CalendarEventView;
  top: number;
  height: number;
  column: number;
  totalColumns: number;
};

/** Assign side-by-side columns for overlapping events on one day. */
export function layoutDayEvents(segments: TimedSegment[], day: Date): GridEventLayout[] {
  const sorted = [...segments].sort((a, b) => a.startMs - b.startMs);
  const layouts: GridEventLayout[] = [];

  type Active = { endMs: number; column: number };
  const active: Active[] = [];

  for (const seg of sorted) {
    for (let i = active.length - 1; i >= 0; i--) {
      if (active[i]!.endMs <= seg.startMs) active.splice(i, 1);
    }

    const used = new Set(active.map((a) => a.column));
    let column = 0;
    while (used.has(column)) column++;

    active.push({ endMs: seg.endMs, column });

    layouts.push({
      event: seg.event,
      top: msToGridTop(seg.startMs, day),
      height: msToGridHeight(seg.startMs, seg.endMs, day),
      column,
      totalColumns: 1,
    });
  }

  // Expand totalColumns within overlap clusters
  for (let i = 0; i < layouts.length; i++) {
    const a = sorted[i]!;
    let maxCol = layouts[i]!.column;
    for (let j = 0; j < sorted.length; j++) {
      if (i === j) continue;
      const b = sorted[j]!;
      if (a.startMs < b.endMs && b.startMs < a.endMs) {
        maxCol = Math.max(maxCol, layouts[j]!.column);
      }
    }
    layouts[i]!.totalColumns = maxCol + 1;
  }

  // Normalize totalColumns per overlap cluster
  for (let i = 0; i < layouts.length; i++) {
    let clusterMax = layouts[i]!.totalColumns;
    for (let j = 0; j < sorted.length; j++) {
      if (i === j) continue;
      const a = sorted[i]!;
      const b = sorted[j]!;
      if (a.startMs < b.endMs && b.startMs < a.endMs) {
        clusterMax = Math.max(clusterMax, layouts[j]!.totalColumns);
      }
    }
    layouts[i]!.totalColumns = clusterMax;
  }

  return layouts;
}

export function allDayEventsForWeek(
  events: CalendarEventView[],
  weekDays: Date[],
): Map<string, CalendarEventView[]> {
  const keys = new Set(weekDays.map(dayKey));
  const map = new Map<string, CalendarEventView[]>();

  for (const event of events) {
    if (!event.allDay) continue;
    const startKey = event.start.slice(0, 10);
    const endKey = event.end.slice(0, 10);
    for (const key of keys) {
      if (key >= startKey && key < endKey) {
        const list = map.get(key) ?? [];
        list.push(event);
        map.set(key, list);
      }
    }
  }
  return map;
}

export function nowLineTopPx(): number | null {
  const now = new Date();
  const mins = minutesSinceMidnight(now) - GRID_START_HOUR * 60;
  if (mins < 0 || mins > (GRID_END_HOUR - GRID_START_HOUR) * 60) return null;
  return mins * PX_PER_MINUTE;
}

export function snapMinutes(minutes: number): number {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

export function slotTimesFromOffset(
  day: Date,
  offsetY: number,
): { start: string; end: string } {
  const gridMins = offsetY / PX_PER_MINUTE;
  const totalMins = snapMinutes(GRID_START_HOUR * 60 + gridMins);
  const clamped = Math.max(
    GRID_START_HOUR * 60,
    Math.min(totalMins, GRID_END_HOUR * 60 - SNAP_MINUTES),
  );

  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  start.setMinutes(clamped);

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 60);

  const pad = (n: number) => String(n).padStart(2, "0");
  const toLocal = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

  return { start: toLocal(start), end: toLocal(end) };
}

export function getHourMarkers(): number[] {
  const hours: number[] = [];
  for (let h = GRID_START_HOUR; h < GRID_END_HOUR; h++) hours.push(h);
  return hours;
}
