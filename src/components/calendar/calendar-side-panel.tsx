"use client";

import { useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon } from "@hugeicons/core-free-icons";

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  eventsOnDay,
  formatEventTimeShort,
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
  userEmail,
  onSelectDay,
  onEventSelect,
}: CalendarSidePanelProps) {
  const dayEvents = useMemo(
    () => eventsOnDay(events, selectedDay),
    [events, selectedDay],
  );

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
            month={selectedDay}
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
            {dayEvents.length === 0 ? (
              <p className="rounded-[0.5rem] border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                No events this day
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {dayEvents.map((event) => {
                  const focused = focusEventId === event.id;
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
                        )}
                      >
                        <p className="truncate text-sm font-medium text-foreground">
                          {event.title}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <HugeiconsIcon
                            icon={Clock01Icon}
                            strokeWidth={2}
                            className="size-3 shrink-0"
                          />
                          {formatEventTimeShort(event.start, event.end, event.allDay)}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Calendars
            </h2>
            <Card size="sm" className="rounded-[0.5rem] bg-background [--card-spacing:--spacing(3)]">
              <CardContent className="flex items-start gap-2">
                <Checkbox id="cal-primary" defaultChecked disabled className="mt-0.5" />
                <Label
                  htmlFor="cal-primary"
                  className="min-w-0 flex-1 cursor-default text-sm leading-snug font-normal"
                >
                  {userEmail || "Primary calendar"}
                </Label>
              </CardContent>
            </Card>
          </section>
        </div>
      </ScrollArea>
    </aside>
  );
}
