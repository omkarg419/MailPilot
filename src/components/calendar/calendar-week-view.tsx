"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { keepPreviousData } from "@tanstack/react-query";
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
import { formatMonthYear, getEventLocalDay, getWeekDays, isSameDay } from "@/lib/calendar-grid";
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

function startOfLocalDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function CalendarWeekView({
  calendarConnected,
  userEmail,
}: CalendarWeekViewProps) {
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => startOfLocalDay(new Date()));
  const [focusEventId, setFocusEventId] = useState<string | null>(null);
  const [scrollTarget, setScrollTarget] = useState<{
    eventId: string;
    seq: number;
  } | null>(null);
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
    placeholderData: keepPreviousData,
  });

  const createEvent = api.calendar.createEvent.useMutation({
    onSuccess: async () => {
      await utils.calendar.listEvents.invalidate(range);
      setDialogOpen(false);
      setForm(emptyForm());
      setEditingEvent(null);
    },
    onError: (e) => setFormError(e.message),
  });

  const updateEvent = api.calendar.updateEvent.useMutation({
    onSuccess: async () => {
      await utils.calendar.listEvents.invalidate(range);
      setDialogOpen(false);
      setForm(emptyForm());
      setEditingEvent(null);
    },
    onError: (e) => setFormError(e.message),
  });

  const deleteEvent = api.calendar.deleteEvent.useMutation({
    onMutate: async ({ eventId }) => {
      await utils.calendar.listEvents.cancel(range).catch(() => undefined);
      const previous = utils.calendar.listEvents.getData(range);
      utils.calendar.listEvents.setData(range, (old) =>
        old ? old.filter((event) => event.id !== eventId) : old,
      );
      return { previous };
    },
    onError: (e, _vars, context) => {
      if (context?.previous) {
        utils.calendar.listEvents.setData(range, context.previous);
      }
      setFormError(e.message);
    },
    onSuccess: async () => {
      setDialogOpen(false);
      setForm(emptyForm());
      setEditingEvent(null);
      setFocusEventId(null);
      await utils.calendar.listEvents.invalidate(range);
    },
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
    setFocusEventId(event.id);
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

  function handleDelete() {
    if (!editingEvent) return;
    setFormError(null);
    deleteEvent.mutate({ eventId: editingEvent.id });
  }

  const handleSelectDay = useCallback(
    (day: Date) => {
      const d = startOfLocalDay(day);
      setSelectedDay(d);
      const inWeek = getWeekDays(weekStart).some((wd) => isSameDay(wd, d));
      if (!inWeek) {
        setWeekStart(startOfWeekMonday(d));
      }
    },
    [weekStart],
  );

  const handleSidePanelEvent = useCallback(
    (event: CalendarEventView) => {
      const eventDay = startOfLocalDay(getEventLocalDay(event));
      setSelectedDay(eventDay);
      const inWeek = getWeekDays(weekStart).some((wd) => isSameDay(wd, eventDay));
      if (!inWeek) {
        setWeekStart(startOfWeekMonday(eventDay));
      }
      setFocusEventId(event.id);
      setScrollTarget({ eventId: event.id, seq: Date.now() });
    },
    [weekStart],
  );

  const handleScrollToEventComplete = useCallback(() => {
    setScrollTarget(null);
  }, []);

  function shiftWeek(deltaDays: number) {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + deltaDays);
      return d;
    });
    setSelectedDay((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + deltaDays);
      return d;
    });
  }

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
            onClick={() => {
              const today = startOfLocalDay(new Date());
              setWeekStart(startOfWeekMonday(today));
              setSelectedDay(today);
            }}
          >
            Today
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-[0.5rem]"
            aria-label="Previous week"
            onClick={() => shiftWeek(-7)}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-[0.5rem]"
            aria-label="Next week"
            onClick={() => shiftWeek(7)}
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
          selectedDay={selectedDay}
          events={eventsQuery.data}
          isEventsFetching={eventsQuery.isFetching}
          isLoading={eventsQuery.isLoading}
          isError={eventsQuery.isError}
          errorMessage={eventsQuery.error?.message}
          focusEventId={focusEventId}
          scrollTarget={scrollTarget}
          onScrollToEventComplete={handleScrollToEventComplete}
          onEventClick={openEdit}
          onSlotClick={openCreateWithTimes}
        />
        <CalendarSidePanel
          selectedDay={selectedDay}
          events={eventsQuery.data ?? []}
          focusEventId={focusEventId}
          userEmail={userEmail}
          onSelectDay={handleSelectDay}
          onEventSelect={handleSidePanelEvent}
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
        isDeleting={deleteEvent.isPending}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}
