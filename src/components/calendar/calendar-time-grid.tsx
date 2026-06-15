"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon } from "@hugeicons/core-free-icons";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
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

/** Min card height (px) before showing the time line below the title. */
const SHOW_TIME_MIN_HEIGHT_PX = 44;

function GridEventBlock({
  layout,
  onEventClick,
}: {
  layout: {
    event: CalendarEventView;
    top: number;
    height: number;
    column: number;
    totalColumns: number;
  };
  onEventClick: (event: CalendarEventView) => void;
}) {
  const { event, top, height, column, totalColumns } = layout;
  const widthPct = 100 / totalColumns;
  const leftPct = column * widthPct;
  const showTime = height >= SHOW_TIME_MIN_HEIGHT_PX;
  const compact = height < 32;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onEventClick(event);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onEventClick(event);
        }
      }}
      className={cn(
        "absolute z-10 flex cursor-pointer flex-col overflow-hidden rounded-[0.35rem]",
        "border border-primary/35 bg-primary/20 ring-1 ring-primary/20",
        "px-1 py-px hover:bg-primary/30",
        compact ? "justify-center" : "justify-start gap-px",
      )}
      style={{
        top,
        height,
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
      }}
    >
      <p
        className={cn(
          "truncate font-semibold text-foreground",
          compact ? "text-[0.625rem] leading-none" : "text-[0.6875rem] leading-tight",
        )}
      >
        {event.title}
      </p>
      {showTime ? (
        <p className="truncate text-[0.625rem] leading-none text-muted-foreground">
          {formatEventTimeShort(event.start, event.end, event.allDay)}
        </p>
      ) : null}
    </div>
  );
}

type CalendarTimeGridProps = {
  weekStart: Date;
  events: CalendarEventView[] | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onEventClick: (event: CalendarEventView) => void;
  onSlotClick: (start: string, end: string) => void;
};

function CalendarGridSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="grid shrink-0 border-b border-border [grid-template-columns:3.5rem_repeat(7,minmax(0,1fr))]">
        <div className="border-r border-border" />
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1 border-r border-border py-2 last:border-r-0"
          >
            <Skeleton className="h-3 w-8" />
            <Skeleton className="size-7 rounded-[0.5rem]" />
          </div>
        ))}
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div
          className="grid [grid-template-columns:3.5rem_repeat(7,minmax(0,1fr))]"
          style={{ minHeight: GRID_HEIGHT_PX }}
        >
          <div className="border-r border-border p-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="mb-12 h-3 w-8" />
            ))}
          </div>
          {Array.from({ length: 7 }).map((_, col) => (
            <div key={col} className="border-r border-border p-2 last:border-r-0">
              <Skeleton className="mb-24 h-16 w-full rounded-[0.35rem]" />
              <Skeleton className="h-12 w-full rounded-[0.35rem]" />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function CalendarTimeGrid({
  weekStart,
  events,
  isLoading,
  isError,
  errorMessage,
  onEventClick,
  onSlotClick,
}: CalendarTimeGridProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
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

  const hasTimedEvents = useMemo(
    () => [...layoutsByDay.values()].some((list) => list.length > 0),
    [layoutsByDay],
  );

  const weekIsEmpty = !hasAllDay && !hasTimedEvents;

  useEffect(() => {
    const tick = () => setNowTop(nowLineTopPx());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
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
    return <CalendarGridSkeleton />;
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
                  <Card
                    key={`${event.id}-${key}`}
                    size="sm"
                    role="button"
                    tabIndex={0}
                    onClick={() => onEventClick(event)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onEventClick(event);
                      }
                    }}
                    className={cn(
                      "mb-0.5 cursor-pointer rounded-[0.35rem] bg-primary/15 py-1 ring-primary/30",
                      "hover:bg-primary/25 [--card-spacing:--spacing(1.5)]",
                    )}
                  >
                    <CardTitle className="truncate px-1.5 text-[0.7rem] font-medium">
                      {event.title}
                    </CardTitle>
                  </Card>
                ))}
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Scrollable time grid */}
      <ScrollArea viewportRef={viewportRef} className="relative min-h-0 flex-1">
        {weekIsEmpty ? (
          <Empty className="absolute inset-x-0 top-24 z-10 mx-auto max-w-sm border-0 bg-transparent">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>No events this week</EmptyTitle>
              <EmptyDescription>
                Click any time slot to schedule something.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}

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

                {layouts.map((layout) => (
                  <GridEventBlock
                    key={`${layout.event.id}-${key}`}
                    layout={layout}
                    onEventClick={onEventClick}
                  />
                ))}
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
      </ScrollArea>
    </div>
  );
}
