"use client";

import { useEffect, useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon, Tick02Icon } from "@hugeicons/core-free-icons";

import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  eventsOnDayForSidePanel,
  formatEventTimeShort,
  isEventUpcomingOnDay,
  isToday,
} from "@/lib/calendar-grid";

import type { CalendarEventView } from "@/server/api/routers/calendar";

type CalendarSidePanelProps = {
  selectedDay: Date;
  events: CalendarEventView[];
  focusEventId: string | null;
  userEmail: string;
  onSelectDay: (day: Date) => void;
  onEventSelect: (event: CalendarEventView) => void;
};

function startOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDayListHeading(day: Date): string {
  if (isToday(day)) return "Today";
  return day.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function CalendarSidePanel({
  selectedDay,
  events,
  focusEventId,
  userEmail: _userEmail,
  onSelectDay,
  onEventSelect,
}: CalendarSidePanelProps) {
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(selectedDay),
  );

  useEffect(() => {
    const next = startOfMonth(selectedDay);
    setVisibleMonth((current) => {
      if (
        current.getFullYear() === next.getFullYear() &&
        current.getMonth() === next.getMonth()
      ) {
        return current;
      }
      return next;
    });
  }, [selectedDay]);

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const sorted = eventsOnDayForSidePanel(events, selectedDay);
    let splitAt = 0;
    while (
      splitAt < sorted.length &&
      isEventUpcomingOnDay(sorted[splitAt]!, selectedDay)
    ) {
      splitAt++;
    }
    return {
      upcomingEvents: sorted.slice(0, splitAt),
      pastEvents: sorted.slice(splitAt),
    };
  }, [events, selectedDay]);

  const hasEvents = upcomingEvents.length > 0 || pastEvents.length > 0;

  function renderEvent(event: CalendarEventView) {
    const focused = focusEventId === event.id;
    const upcoming = isEventUpcomingOnDay(event, selectedDay);
    return (
      <li key={event.id}>
        <button
          type="button"
          onClick={() => onEventSelect(event)}
          className={cn(
            "w-full rounded-[0.5rem] border px-3 py-2 text-left transition-colors",
            focused
              ? "border-primary/50 bg-primary/15 ring-1 ring-primary/30"
              : "border-border bg-background hover:border-primary/30 hover:bg-muted/40",
            !upcoming && !focused && "opacity-80",
          )}
        >
          <p
            className={cn(
              "truncate text-sm font-medium",
              upcoming ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {event.title}
          </p>
          <p
            className={cn(
              "mt-0.5 flex items-center gap-1.5 truncate text-xs",
              upcoming ? "text-foreground/80" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-[0.25rem]",
                upcoming ? "bg-primary/15 text-primary" : "text-muted-foreground",
              )}
            >
              <HugeiconsIcon
                icon={upcoming ? Clock01Icon : Tick02Icon}
                strokeWidth={2}
                className="size-2.5"
              />
            </span>
            {formatEventTimeShort(event.start, event.end, event.allDay)}
          </p>
        </button>
      </li>
    );
  }

  return (
    <aside
      className={cn(
        "flex w-64 shrink-0 flex-col overflow-hidden border-l border-border bg-card/50",
      )}
    >
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-5 p-4">
          <Calendar
            mode="single"
            selected={selectedDay}
            month={visibleMonth}
            onMonthChange={setVisibleMonth}
            onSelect={(day) => {
              if (day) {
                onSelectDay(day);
              }
            }}
            className="w-full rounded-[0.5rem] p-0 [--cell-size:2rem]"
          />

          <section className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {formatDayListHeading(selectedDay)}
            </h2>
            {hasEvents ? (
              <ul className="flex flex-col gap-1.5">
                {upcomingEvents.map(renderEvent)}
                {upcomingEvents.length > 0 && pastEvents.length > 0 ? (
                  <li
                    aria-hidden
                    className="my-0.5 list-none border-t border-border/80"
                  />
                ) : null}
                {pastEvents.map(renderEvent)}
              </ul>
            ) : (
              <p className="rounded-[0.5rem] border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                No events this day
              </p>
            )}
          </section>

          
        </div>
      </ScrollArea>
    </aside>
  );
}
