"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  GRID_HEIGHT_PX,
  HOUR_HEIGHT_PX,
  allDayEventsForWeek,
  dayKey,
  formatEventTimeShort,
  formatHourLabel,
  getHourMarkers,
  getWeekDays,
  isToday,
  layoutDayEvents,
  nowLineTopPx,
  segmentForDay,
  slotTimesFromOffset,
} from "@/lib/calendar-grid";

import type { CalendarEventView } from "@/server/api/routers/calendar";

type CalendarTimeGridProps = {
  weekStart: Date;
  events: CalendarEventView[] | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onEventClick: (event: CalendarEventView) => void;
  onSlotClick: (start: string, end: string) => void;
};

export function CalendarTimeGrid({
  weekStart,
  events,
  isLoading,
  isError,
  errorMessage,
  onEventClick,
  onSlotClick,
}: CalendarTimeGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [nowTop, setNowTop] = useState<number | null>(() => nowLineTopPx());

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const hourMarkers = useMemo(() => getHourMarkers(), []);
  const allDayByDay = useMemo(
    () => allDayEventsForWeek(events ?? [], weekDays),
    [events, weekDays],
  );

  const layoutsByDay = useMemo(() => {
    const map = new Map<string, ReturnType<typeof layoutDayEvents>>();
    for (const day of weekDays) {
      const key = dayKey(day);
      const segments = (events ?? [])
        .map((e) => segmentForDay(e, day))
        .filter((s): s is NonNullable<typeof s> => s !== null);
      map.set(key, layoutDayEvents(segments, day));
    }
    return map;
  }, [events, weekDays]);

  const hasAllDay = useMemo(
    () => [...allDayByDay.values()].some((list) => list.length > 0),
    [allDayByDay],
  );

  useEffect(() => {
    const tick = () => setNowTop(nowLineTopPx());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const defaultScroll = Math.max(0, 7 * HOUR_HEIGHT_PX - el.clientHeight / 2);
    el.scrollTop = defaultScroll;
  }, [weekStart]);

  function handleColumnClick(day: Date, e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const { start, end } = slotTimesFromOffset(day, offsetY);
    onSlotClick(start, end);
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
        <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="size-5 animate-spin" />
        Loading events…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTitle>Could not load events</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Day headers */}
      <div className="grid shrink-0 border-b border-border bg-background [grid-template-columns:3.5rem_repeat(7,minmax(0,1fr))]">
        <div className="border-r border-border" />
        {weekDays.map((day) => {
          const today = isToday(day);
          return (
            <div
              key={dayKey(day)}
              className={cn(
                "flex flex-col items-center border-r border-border py-2 last:border-r-0",
                today && "bg-primary/5",
              )}
            >
              <span className="text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
                {day.toLocaleDateString(undefined, { weekday: "short" })}
              </span>
              <span
                className={cn(
                  "mt-0.5 flex size-7 items-center justify-center text-sm font-semibold",
                  today && "rounded-[0.5rem] bg-primary text-primary-foreground",
                )}
              >
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* All-day row */}
      {hasAllDay ? (
        <div className="grid shrink-0 border-b border-border bg-muted/20 [grid-template-columns:3.5rem_repeat(7,minmax(0,1fr))]">
          <div className="flex items-center justify-end border-r border-border pr-2 text-[0.65rem] text-muted-foreground">
            all-day
          </div>
          {weekDays.map((day) => {
            const key = dayKey(day);
            const dayEvents = allDayByDay.get(key) ?? [];
            return (
              <div
                key={key}
                className="min-h-7 border-r border-border p-1 last:border-r-0"
              >
                {dayEvents.map((event) => (
                  <button
                    key={`${event.id}-${key}`}
                    type="button"
                    onClick={() => onEventClick(event)}
                    className={cn(
                      "mb-0.5 w-full truncate rounded-[0.35rem] border border-primary/30 bg-primary/15 px-1.5 py-0.5",
                      "text-left text-[0.7rem] font-medium text-foreground hover:bg-primary/25",
                    )}
                  >
                    {event.title}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div
          className="relative grid [grid-template-columns:3.5rem_repeat(7,minmax(0,1fr))]"
          style={{ minHeight: GRID_HEIGHT_PX }}
        >
          {/* Time gutter */}
          <div className="relative border-r border-border">
            {hourMarkers.map((hour) => (
              <div
                key={hour}
                className="relative border-b border-border/60"
                style={{ height: HOUR_HEIGHT_PX }}
              >
                <span className="absolute -top-2.5 right-2 font-mono text-[0.65rem] text-muted-foreground">
                  {formatHourLabel(hour)}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => {
            const key = dayKey(day);
            const layouts = layoutsByDay.get(key) ?? [];
            const today = isToday(day);

            return (
              <div
                key={key}
                className={cn(
                  "relative border-r border-border last:border-r-0",
                  today && "bg-primary/[0.02]",
                )}
                style={{ height: GRID_HEIGHT_PX }}
                onClick={(e) => handleColumnClick(day, e)}
                onKeyDown={undefined}
                role="presentation"
              >
                {hourMarkers.map((hour) => (
                  <div
                    key={hour}
                    className="border-b border-border/40"
                    style={{ height: HOUR_HEIGHT_PX }}
                  />
                ))}

                {layouts.map((layout) => {
                  const widthPct = 100 / layout.totalColumns;
                  const leftPct = layout.column * widthPct;
                  return (
                    <button
                      key={`${layout.event.id}-${key}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(layout.event);
                      }}
                      className={cn(
                        "absolute z-10 overflow-hidden rounded-[0.35rem] border border-primary/35",
                        "bg-primary/20 px-1.5 py-1 text-left hover:bg-primary/30",
                      )}
                      style={{
                        top: layout.top,
                        height: layout.height,
                        left: `calc(${leftPct}% + 2px)`,
                        width: `calc(${widthPct}% - 4px)`,
                      }}
                    >
                      <p className="truncate text-[0.7rem] leading-tight font-semibold text-foreground">
                        {layout.event.title}
                      </p>
                      {layout.height >= 36 ? (
                        <p className="truncate text-[0.65rem] text-muted-foreground">
                          {formatEventTimeShort(
                            layout.event.start,
                            layout.event.end,
                            layout.event.allDay,
                          )}
                        </p>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            );
          })}

          {/* Now indicator across grid */}
          {nowTop !== null && weekDays.some(isToday) ? (
            <div
              className="pointer-events-none absolute right-0 left-0 z-20"
              style={{ top: nowTop }}
            >
              <div className="grid [grid-template-columns:3.5rem_repeat(7,minmax(0,1fr))]">
                <div className="relative flex items-center justify-end pr-1">
                  <span className="rounded-[0.25rem] bg-primary px-1 py-0.5 font-mono text-[0.6rem] text-primary-foreground">
                    {new Date().toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {weekDays.map((day) => (
                  <div key={dayKey(day)} className="relative">
                    {isToday(day) ? (
                      <div className="absolute top-1/2 right-0 left-0 h-px -translate-y-1/2 bg-primary">
                        <div className="absolute top-1/2 -left-1 size-2 -translate-y-1/2 rounded-full bg-primary" />
                      </div>
                    ) : (
                      <div className="absolute top-1/2 right-0 left-0 h-px -translate-y-1/2 bg-primary/40" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
