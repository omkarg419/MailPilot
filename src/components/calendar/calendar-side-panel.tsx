"use client";

import { useMemo } from "react";

import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getWeekDays, isSameDay } from "@/lib/calendar-grid";
import { startOfWeekMonday } from "@/lib/calendar-week";

type CalendarSidePanelProps = {
  weekStart: Date;
  userEmail: string;
  onSelectDay: (weekStart: Date) => void;
};

export function CalendarSidePanel({
  weekStart,
  userEmail,
  onSelectDay,
}: CalendarSidePanelProps) {
  const selectedDay = useMemo(() => {
    const today = new Date();
    const days = getWeekDays(weekStart);
    return days.find((d) => isSameDay(d, today)) ?? days[0]!;
  }, [weekStart]);

  return (
    <aside
      className={cn(
        "flex w-64 shrink-0 flex-col gap-6 border-l border-border bg-card/50 p-4",
        "overflow-y-auto",
      )}
    >
      <Calendar
        mode="single"
        selected={selectedDay}
        month={selectedDay}
        onSelect={(day) => {
          if (day) onSelectDay(startOfWeekMonday(day));
        }}
        className="w-full rounded-[0.5rem] p-0 [--cell-size:2rem]"
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Calendars
        </h2>
        <div className="flex items-start gap-2 rounded-[0.5rem] border border-border bg-background px-3 py-2">
          <Checkbox id="cal-primary" defaultChecked disabled className="mt-0.5" />
          <Label
            htmlFor="cal-primary"
            className="min-w-0 flex-1 cursor-default text-sm leading-snug font-normal"
          >
            {userEmail || "Primary calendar"}
          </Label>
        </div>
      </section>
    </aside>
  );
}
