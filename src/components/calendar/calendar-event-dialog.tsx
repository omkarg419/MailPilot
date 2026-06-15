"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  Calendar03Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Delete02Icon,
  Loading03Icon,
  NoteIcon,
  PencilEdit01Icon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

import type { CalendarEventView } from "@/server/api/routers/calendar";

export type EventFormState = {
  title: string;
  start: string;
  end: string;
  description: string;
};

type CalendarEventDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEvent: CalendarEventView | null;
  form: EventFormState;
  onFormChange: (form: EventFormState) => void;
  formError: string | null;
  isSaving: boolean;
  isDeleting?: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onDelete?: () => void;
};

function EventFieldLabel({
  icon,
  label,
  htmlFor,
}: {
  icon: typeof Tag01Icon;
  label: string;
  htmlFor: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
    >
      <HugeiconsIcon icon={icon} strokeWidth={2} className="size-3.5" />
      {label}
    </label>
  );
}

export function CalendarEventDialog({
  open,
  onOpenChange,
  editingEvent,
  form,
  onFormChange,
  formError,
  isSaving,
  isDeleting = false,
  onSubmit,
  onDelete,
}: CalendarEventDialogProps) {
  const isEdit = Boolean(editingEvent);
  const isBusy = isSaving || isDeleting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden rounded-[0.75rem] p-0 sm:max-w-lg"
      >
        <form onSubmit={onSubmit}>
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-[0.5rem] bg-primary/10 text-primary">
                <HugeiconsIcon
                  icon={isEdit ? PencilEdit01Icon : Calendar03Icon}
                  strokeWidth={2}
                  className="size-4"
                />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold text-foreground">
                  {isEdit ? "Edit event" : "New event"}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                  {isEdit
                    ? "Update details on your primary calendar."
                    : "Schedule a meeting on your primary calendar."}
                </DialogDescription>
              </div>
            </div>
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 rounded-[0.5rem] text-muted-foreground"
                  disabled={isBusy}
                />
              }
            >
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>

          {/* Fields */}
          <div className="flex flex-col">
            <div className="flex flex-col gap-2 border-b border-border px-5 py-4">
              <EventFieldLabel icon={Tag01Icon} label="Title" htmlFor="event-title" />
              <InputGroup className="h-9 rounded-[0.5rem]">
                <InputGroupAddon align="inline-start">
                  <HugeiconsIcon icon={Tag01Icon} strokeWidth={2} />
                </InputGroupAddon>
                <InputGroupInput
                  id="event-title"
                  value={form.title}
                  onChange={(e) => onFormChange({ ...form, title: e.target.value })}
                  placeholder="Team sync, dentist, …"
                  disabled={isBusy}
                  autoFocus
                />
              </InputGroup>
            </div>

            <div className="grid gap-4 border-b border-border px-5 py-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <EventFieldLabel icon={Clock01Icon} label="Start" htmlFor="event-start" />
                <InputGroup className="h-9 rounded-[0.5rem]">
                  <InputGroupAddon align="inline-start">
                    <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="event-start"
                    type="datetime-local"
                    value={form.start.slice(0, 16)}
                    onChange={(e) =>
                      onFormChange({ ...form, start: `${e.target.value}:00` })
                    }
                    disabled={isBusy}
                    className="text-sm"
                  />
                </InputGroup>
              </div>
              <div className="flex flex-col gap-2">
                <EventFieldLabel icon={Clock01Icon} label="End" htmlFor="event-end" />
                <InputGroup className="h-9 rounded-[0.5rem]">
                  <InputGroupAddon align="inline-start">
                    <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="event-end"
                    type="datetime-local"
                    value={form.end.slice(0, 16)}
                    onChange={(e) =>
                      onFormChange({ ...form, end: `${e.target.value}:00` })
                    }
                    disabled={isBusy}
                    className="text-sm"
                  />
                </InputGroup>
              </div>
            </div>

            <div className="flex flex-col gap-2 px-5 py-4">
              <EventFieldLabel
                icon={NoteIcon}
                label="Description"
                htmlFor="event-description"
              />
              <InputGroup className="rounded-[0.5rem]">
                <InputGroupAddon align="block-start" className="pt-2.5">
                  <HugeiconsIcon icon={NoteIcon} strokeWidth={2} />
                </InputGroupAddon>
                <InputGroupTextarea
                  id="event-description"
                  value={form.description}
                  onChange={(e) =>
                    onFormChange({ ...form, description: e.target.value })
                  }
                  placeholder="Agenda, location, or notes…"
                  disabled={isBusy}
                  rows={3}
                  className="min-h-24 text-sm"
                />
              </InputGroup>
            </div>
          </div>

          {formError ? (
            <div className="border-t border-border px-5 py-3">
              <Alert variant="destructive" className="rounded-[0.5rem]">
                <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} />
                <AlertTitle>Could not save</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            </div>
          ) : null}

          <DialogFooter className="flex-row items-center justify-between gap-2 border-t border-border bg-muted/20 px-5 py-4 sm:justify-between">
            {isEdit && onDelete ? (
              <Button
                type="button"
                variant="destructive"
                className="rounded-[0.5rem]"
                onClick={onDelete}
                disabled={isBusy}
              >
                {isDeleting ? (
                  <>
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      strokeWidth={2}
                      className="animate-spin"
                    />
                    Deleting…
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                    Delete
                  </>
                )}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-[0.5rem]"
                onClick={() => onOpenChange(false)}
                disabled={isBusy}
              >
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                Cancel
              </Button>
              <Button
                type="submit"
                className={cn("rounded-[0.5rem]", isSaving && "min-w-32")}
                disabled={isBusy}
              >
                {isSaving ? (
                  <>
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      strokeWidth={2}
                      className="animate-spin"
                    />
                    Saving…
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />
                    {isEdit ? "Save changes" : "Create event"}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
