"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  onSubmit: (e: React.FormEvent) => void;
};

export function CalendarEventDialog({
  open,
  onOpenChange,
  editingEvent,
  form,
  onFormChange,
  formError,
  isSaving,
  onSubmit,
}: CalendarEventDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[0.75rem] sm:max-w-md">
        <form onSubmit={onSubmit}>
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
                onChange={(e) => onFormChange({ ...form, title: e.target.value })}
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
                  onFormChange({ ...form, start: `${e.target.value}:00` })
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
                  onFormChange({ ...form, end: `${e.target.value}:00` })
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
                  onFormChange({ ...form, description: e.target.value })
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
              onClick={() => onOpenChange(false)}
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
  );
}
