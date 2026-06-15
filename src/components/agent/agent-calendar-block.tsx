"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Loading03Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCalendarEventRange } from "@/lib/calendar-display";
import type { CalendarBlockStatus } from "@/types/agent-chat";

export type AgentCalendarBlockProps = {
  id: string;
  title: string;
  start: string;
  end: string;
  attendees?: string[];
  description?: string;
  status: CalendarBlockStatus;
  message?: string;
  onStatusChange?: (
    id: string,
    status: CalendarBlockStatus,
    message?: string,
  ) => void;
  onBooked?: (event: {
    title: string;
    start: string;
    end: string;
    attendees?: string[];
  }) => void;
};

export function AgentCalendarBlock({
  id,
  title,
  start,
  end,
  attendees,
  description,
  status,
  message,
  onStatusChange,
  onBooked,
}: AgentCalendarBlockProps) {
  const [isBooking, setIsBooking] = useState(false);

  async function handleBook() {
    setIsBooking(true);
    try {
      const res = await fetch("/api/agent/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_calendar_event",
          payload: {
            calendarId: "primary",
            title,
            start,
            end,
            attendees,
            description,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        }),
      });
      const data = (await res.json()) as { status?: string; error?: string };
      if (!res.ok) {
        onStatusChange?.(id, "failed", data.error ?? "Could not book event.");
        return;
      }
      onStatusChange?.(id, "booked", "Event scheduled.");
      onBooked?.({ title, start, end, attendees });
    } catch {
      onStatusChange?.(id, "failed", "Could not book event.");
    } finally {
      setIsBooking(false);
    }
  }

  function handleCancel() {
    onStatusChange?.(id, "failed", "Event not scheduled.");
  }

  const isDone = status === "booked" || status === "failed";

  return (
    <Card className="max-w-md border-border bg-card shadow-sm">
      <CardHeader className="gap-2 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              icon={Calendar03Icon}
              strokeWidth={2}
              className="size-5 text-primary"
            />
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
          </div>
          {status === "booked" && (
            <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-3.5" />
              Scheduled
            </Badge>
          )}
          {status === "failed" && (
            <Badge variant="secondary" className="text-muted-foreground">
              Cancelled
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4 shrink-0" />
          <span>{formatCalendarEventRange(start, end)}</span>
        </div>
        {attendees && attendees.length > 0 && (
          <div className="flex items-start gap-2 text-muted-foreground">
            <HugeiconsIcon
              icon={UserGroupIcon}
              strokeWidth={2}
              className="mt-0.5 size-4 shrink-0"
            />
            <span>{attendees.join(", ")}</span>
          </div>
        )}
        {description && (
          <p className="whitespace-pre-wrap text-muted-foreground">{description}</p>
        )}
        {message && (
          <p
            className={cn(
              "text-xs",
              status === "booked" ? "text-primary" : "text-destructive",
            )}
          >
            {message}
          </p>
        )}
      </CardContent>
      {status === "proposed" && (
        <CardFooter className="gap-2 border-t border-border pt-4">
          <Button
            type="button"
            size="sm"
            onClick={() => void handleBook()}
            disabled={isBooking}
          >
            {isBooking ? (
              <>
                <HugeiconsIcon
                  icon={Loading03Icon}
                  strokeWidth={2}
                  className="size-4 animate-spin"
                />
                Booking…
              </>
            ) : (
              "Book Event"
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isBooking}
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-4" />
            Cancel
          </Button>
        </CardFooter>
      )}
      {isDone && status === "booked" && (
        <CardFooter className="border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Event created on your calendar.
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
