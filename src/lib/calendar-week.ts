/** Monday-based week helpers for the calendar UI. */

export function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekRange(weekStart: Date): {
  timeMin: string;
  timeMax: string;
} {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 7);
  return {
    timeMin: weekStart.toISOString(),
    timeMax: end.toISOString(),
  };
}

export function formatWeekLabel(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const startFmt = weekStart.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const endFmt = weekEnd.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${startFmt} – ${endFmt}`;
}

export function dayKeyFromEventStart(start: string, allDay: boolean): string {
  if (allDay) return start.slice(0, 10);
  const parsed = new Date(start);
  if (Number.isNaN(parsed.getTime())) return start.slice(0, 10);
  return parsed.toLocaleDateString("en-CA");
}

export function formatDayHeading(dayKey: string): string {
  const parsed = new Date(`${dayKey}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return dayKey;
  return parsed.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/** Convert API datetime to value for datetime-local input. */
export function toDatetimeLocalValue(value: string, allDay: boolean): string {
  if (allDay) return `${value.slice(0, 10)}T09:00`;
  if (value.length >= 16 && !value.includes("Z") && !/[+-]\d{2}:\d{2}$/.test(value)) {
    return value.slice(0, 16);
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string): string {
  return value.length === 16 ? `${value}:00` : value;
}
