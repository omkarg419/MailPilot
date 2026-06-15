"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  dayKeyFromEventStart,
  formatDayHeading,
  formatWeekLabel,
  fromDatetimeLocalValue,
  getWeekRange,
  startOfWeekMonday,
  toDatetimeLocalValue,
} from "@/lib/calendar-week";
import { formatCalendarEventRange } from "@/lib/calendar-display";
import { api } from "@/trpc/react";

import type { CalendarEventView } from "@/server/api/routers/calendar";

type CalendarWeekViewProps = {
  calendarConnected: boolean;
};

type EventFormState = {
  title: string;
  start: string;
  end: string;
  description: string;
};

const emptyForm = (): EventFormState => ({
  title: "",
  start: "",
  end: "",
  description: "",
});

export function CalendarWeekView({ calendarConnected }: CalendarWeekViewProps) {
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventView | null>(null);
  const [form, setForm] = useState<EventFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const range = useMemo(() => getWeekRange(weekStart), [weekStart]);

  const utils = api.useUtils();
  const eventsQuery = api.calendar.listEvents.useQuery(range, {
    enabled: calendarConnected,
  });

  const createEvent = api.calendar.createEvent.useMutation({
    onSuccess: async () => {
      await utils.calendar.listEvents.invalidate();
      setDialogOpen(false);
      setForm(emptyForm());
      setEditingEvent(null);
    },
    onError: (e) => setFormError(e.message),
  });

  const updateEvent = api.calendar.updateEvent.useMutation({
    onSuccess: async () => {
      await utils.calendar.listEvents.invalidate();
      setDialogOpen(false);
      setForm(emptyForm());
      setEditingEvent(null);
    },
    onError: (e) => setFormError(e.message),
  });

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEventView[]>();
    const events = eventsQuery.data ?? [];
    for (const event of events) {
      const key = dayKeyFromEventStart(event.start, event.allDay);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [eventsQuery.data]);

  function openCreate() {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const end = new Date(now);
    end.setHours(end.getHours() + 1);
    const pad = (n: number) => String(n).padStart(2, "0");
    const toLocal = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

    setEditingEvent(null);
    setForm({
      title: "",
      start: toLocal(now),
      end: toLocal(end),
      description: "",
    });
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(event: CalendarEventView) {
    setEditingEvent(event);
    setForm({
      title: event.title,
      start: toDatetimeLocalValue(event.start, event.allDay),
      end: toDatetimeLocalValue(event.end, event.allDay),
      description: event.description ?? "",
    });
    setFormError(null);
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const payload = {
      title: form.title.trim(),
      start: fromDatetimeLocalValue(form.start),
      end: fromDatetimeLocalValue(form.end),
      description: form.description.trim() || undefined,
      timeZone,
    };
    if (!payload.title) {
      setFormError("Title is required.");
      return;
    }
    if (editingEvent) {
      updateEvent.mutate({ eventId: editingEvent.id, ...payload });
    } else {
      createEvent.mutate(payload);
    }
  }

  const isSaving = createEvent.isPending || updateEvent.isPending;

  if (!calendarConnected) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Alert className="max-w-md">
          <AlertTitle>Calendar not connected</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <span>Connect Google Calendar to view and manage events.</span>
            <Link href="/connect" className={cn(buttonVariants(), "w-fit rounded-[0.75rem]")}>
              Go to Connect
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-5 text-primary" />
          <div>
            <h1 className="text-lg font-semibold text-foreground">Calendar</h1>
            <p className="text-sm text-muted-foreground">{formatWeekLabel(weekStart)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-[0.5rem]"
            onClick={() => setWeekStart(startOfWeekMonday(new Date()))}
          >
            Today
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-[0.5rem]"
            aria-label="Previous week"
            onClick={() => {
              const d = new Date(weekStart);
              d.setDate(d.getDate() - 7);
              setWeekStart(d);
            }}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-[0.5rem]"
            aria-label="Next week"
            onClick={() => {
              const d = new Date(weekStart);
              d.setDate(d.getDate() + 7);
              setWeekStart(d);
            }}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
          </Button>
          <Button
            type="button"
            size="sm"
            className="rounded-[0.75rem]"
            onClick={openCreate}
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
            New event
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        {eventsQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="size-5 animate-spin" />
            Loading events…
          </div>
        ) : eventsQuery.isError ? (
          <Alert variant="destructive" className="max-w-lg">
            <AlertTitle>Could not load events</AlertTitle>
            <AlertDescription>{eventsQuery.error.message}</AlertDescription>
          </Alert>
        ) : eventsByDay.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No events this week. Click New event to schedule something.
          </p>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-8">
            {eventsByDay.map(([dayKey, dayEvents]) => (
              <section key={dayKey}>
                <h2 className="mb-3 text-sm font-semibold text-foreground">
                  {formatDayHeading(dayKey)}
                </h2>
                <ul className="flex flex-col gap-2">
                  {dayEvents.map((event) => (
                    <li key={event.id}>
                      <button
                        type="button"
                        onClick={() => openEdit(event)}
                        className={cn(
                          "w-full rounded-[0.75rem] border border-border bg-card px-4 py-3 text-left",
                          "transition-colors hover:border-primary/40 hover:bg-muted/30",
                        )}
                      >
                        <p className="font-medium text-foreground">{event.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatCalendarEventRange(event.start, event.end)}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-[0.75rem] sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingEvent ? "Edit event" : "New event"}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="event-title" className="text-sm font-medium">
                  Title
                </label>
                <Input
                  id="event-title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  disabled={isSaving}
                  className="rounded-[0.5rem]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="event-start" className="text-sm font-medium">
                  Start
                </label>
                <Input
                  id="event-start"
                  type="datetime-local"
                  value={form.start.slice(0, 16)}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, start: `${e.target.value}:00` }))
                  }
                  disabled={isSaving}
                  className="rounded-[0.5rem]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="event-end" className="text-sm font-medium">
                  End
                </label>
                <Input
                  id="event-end"
                  type="datetime-local"
                  value={form.end.slice(0, 16)}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, end: `${e.target.value}:00` }))
                  }
                  disabled={isSaving}
                  className="rounded-[0.5rem]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="event-description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="event-description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  disabled={isSaving}
                  rows={3}
                  className="rounded-[0.5rem]"
                />
              </div>
              {formError ? (
                <p className="text-sm text-destructive">{formError}</p>
              ) : null}
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-[0.5rem]"
                onClick={() => setDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-[0.5rem]" disabled={isSaving}>
                {isSaving ? "Saving…" : editingEvent ? "Save changes" : "Create event"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
