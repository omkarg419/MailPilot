"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { CalendarEventDialog } from "@/components/calendar/calendar-event-dialog";
import type { EventFormState } from "@/components/calendar/calendar-event-dialog";
import { CalendarSidePanel } from "@/components/calendar/calendar-side-panel";
import { CalendarTimeGrid } from "@/components/calendar/calendar-time-grid";
import { cn } from "@/lib/utils";
import { formatMonthYear } from "@/lib/calendar-grid";
import {
  fromDatetimeLocalValue,
  getWeekRange,
  startOfWeekMonday,
  toDatetimeLocalValue,
} from "@/lib/calendar-week";
import { api } from "@/trpc/react";

import type { CalendarEventView } from "@/server/api/routers/calendar";

type CalendarWeekViewProps = {
  calendarConnected: boolean;
  userEmail: string;
};

const emptyForm = (): EventFormState => ({
  title: "",
  start: "",
  end: "",
  description: "",
});

export function CalendarWeekView({
  calendarConnected,
  userEmail,
}: CalendarWeekViewProps) {
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventView | null>(null);
  const [form, setForm] = useState<EventFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const range = useMemo(() => getWeekRange(weekStart), [weekStart]);

  const monthLabel = useMemo(() => {
    const mid = new Date(weekStart);
    mid.setDate(mid.getDate() + 3);
    return formatMonthYear(mid);
  }, [weekStart]);

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

  function openCreateWithTimes(start: string, end: string) {
    setEditingEvent(null);
    setForm({ title: "", start, end, description: "" });
    setFormError(null);
    setDialogOpen(true);
  }

  function openCreate() {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const end = new Date(now);
    end.setHours(end.getHours() + 1);
    const pad = (n: number) => String(n).padStart(2, "0");
    const toLocal = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

    openCreateWithTimes(toLocal(now), toLocal(end));
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
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-[0.5rem] font-medium uppercase"
            onClick={() => setWeekStart(startOfWeekMonday(new Date()))}
          >
            Today
          </Button>
          <Button
            type="button"
            variant="ghost"
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
            variant="ghost"
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
          <h1 className="ml-2 text-xl font-semibold text-foreground">{monthLabel}</h1>
        </div>
        <Button
          type="button"
          size="sm"
          className="rounded-[0.75rem]"
          onClick={openCreate}
        >
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          New event
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <CalendarTimeGrid
          weekStart={weekStart}
          events={eventsQuery.data}
          isLoading={eventsQuery.isLoading}
          isError={eventsQuery.isError}
          errorMessage={eventsQuery.error?.message}
          onEventClick={openEdit}
          onSlotClick={openCreateWithTimes}
        />
        <CalendarSidePanel
          weekStart={weekStart}
          userEmail={userEmail}
          onSelectDay={setWeekStart}
        />
      </div>

      <CalendarEventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingEvent={editingEvent}
        form={form}
        onFormChange={setForm}
        formError={formError}
        isSaving={isSaving}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
