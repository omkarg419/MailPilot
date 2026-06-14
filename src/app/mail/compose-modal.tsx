"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Attachment01Icon,
  Cancel01Icon,
  ContactBookIcon,
  FloppyDiskIcon,
  Link01Icon,
  MailReplyIcon,
  MailSend01Icon,
  MinusSignIcon,
  NoteIcon,
  PencilEdit01Icon,
  SmileIcon,
  Tag01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

export type ComposeInitial = {
  to?: string;
  subject?: string;
  threadId?: string;
};

type ComposeModalProps = {
  initial: ComposeInitial | null;
  onClose: () => void;
  onSent: () => void;
};

function parseRecipients(raw: string): string[] {
  return raw
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ComposeFieldLabel({
  icon,
  label,
  htmlFor,
}: {
  icon: typeof UserIcon;
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

export function ComposeModal({ initial, onClose, onSent }: ComposeModalProps) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isReply = !!initial?.threadId;

  useEffect(() => {
    if (initial) {
      setTo(initial.to ?? "");
      setSubject(initial.subject ?? "");
      setBody("");
      setError(null);
    }
  }, [initial]);

  const sendEmail = api.gmail.sendEmail.useMutation({
    onSuccess: () => onSent(),
    onError: (e) => setError(e.message),
  });
  const createDraft = api.gmail.createDraft.useMutation({
    onSuccess: () => onSent(),
    onError: (e) => setError(e.message),
  });

  const recipients = parseRecipients(to);
  const invalid = recipients.filter((r) => !EMAIL_RE.test(r));
  const pending = sendEmail.isPending || createDraft.isPending;

  const validate = () => {
    if (recipients.length === 0) {
      setError("Add at least one recipient.");
      return false;
    }
    if (invalid.length > 0) {
      setError(`Invalid email: ${invalid.join(", ")}`);
      return false;
    }
    setError(null);
    return true;
  };

  const handleSend = () => {
    if (!initial || !validate()) return;
    sendEmail.mutate({
      to: recipients,
      subject,
      body,
      threadId: initial.threadId,
    });
  };

  const handleDraft = () => {
    if (!initial || !validate()) return;
    createDraft.mutate({
      to: recipients,
      subject,
      body,
      threadId: initial.threadId,
    });
  };

  return (
    <Dialog
      open={!!initial}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <HugeiconsIcon
              icon={isReply ? MailReplyIcon : PencilEdit01Icon}
              strokeWidth={2}
              className="size-4 text-primary"
            />
            <DialogTitle className="text-sm font-semibold">
              {isReply ? "Reply" : "New message"}
            </DialogTitle>
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
              aria-label="Minimize"
            >
              <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2} />
            </Button>
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground"
                />
              }
            >
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex flex-col gap-2 border-b border-border px-5 py-4">
            <ComposeFieldLabel icon={UserIcon} label="To" htmlFor="compose-to" />
            <InputGroup>
              <InputGroupInput
                id="compose-to"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Comma-separated recipients"
                disabled={pending}
              />
              <InputGroupAddon align="inline-end">
                <HugeiconsIcon icon={ContactBookIcon} strokeWidth={2} />
              </InputGroupAddon>
            </InputGroup>
          </div>

          <div className="flex flex-col gap-2 border-b border-border px-5 py-4">
            <ComposeFieldLabel
              icon={Tag01Icon}
              label="Subject"
              htmlFor="compose-subject"
            />
            <InputGroup>
              <InputGroupInput
                id="compose-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                disabled={pending}
              />
            </InputGroup>
          </div>

          <div className="flex flex-col gap-2 px-5 py-4">
            <ComposeFieldLabel
              icon={NoteIcon}
              label="Message"
              htmlFor="compose-body"
            />
            <div className="relative">
              <Textarea
                id="compose-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message…"
                rows={10}
                disabled={pending}
                className={cn(
                  "min-h-52 resize-y bg-input/20 pb-10 dark:bg-input/30",
                )}
              />
              <div className="pointer-events-none absolute right-2 bottom-2 flex items-center gap-0.5">
                <InputGroupButton
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  tabIndex={-1}
                  aria-hidden
                  disabled
                >
                  <HugeiconsIcon icon={SmileIcon} strokeWidth={2} />
                </InputGroupButton>
                <InputGroupButton
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  tabIndex={-1}
                  aria-hidden
                  disabled
                >
                  <HugeiconsIcon icon={Attachment01Icon} strokeWidth={2} />
                </InputGroupButton>
                <InputGroupButton
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  tabIndex={-1}
                  aria-hidden
                  disabled
                >
                  <HugeiconsIcon icon={Link01Icon} strokeWidth={2} />
                </InputGroupButton>
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="border-t border-border px-5 py-3">
            <Alert variant="destructive">
              <AlertTitle>Could not send</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : null}

        <DialogFooter className="flex-row justify-between border-t border-border bg-muted/20 px-5 py-4 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleDraft}
            disabled={pending}
          >
            <HugeiconsIcon icon={FloppyDiskIcon} strokeWidth={2} />
            {createDraft.isPending ? "Saving…" : "Save draft"}
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleSend}
            disabled={pending}
          >
            <HugeiconsIcon icon={MailSend01Icon} strokeWidth={2} />
            {sendEmail.isPending ? "Sending…" : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
