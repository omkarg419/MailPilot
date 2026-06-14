"use client";

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
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
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

const COMPOSE_EMOJIS = [
  "😀", "😊", "😂", "🙂", "😉", "🙏", "👍", "👎",
  "❤️", "🎉", "🔥", "✨", "💯", "✅", "❌", "⭐",
  "📎", "📅", "📧", "💡", "🚀", "👀", "🤔", "😅",
] as const;

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function formatLinkInsert(url: string, text: string): string {
  const label = text.trim();
  return label ? `${label} (${url})` : url;
}

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

type ComposeMessageToolbarProps = {
  body: string;
  setBody: Dispatch<SetStateAction<string>>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  disabled: boolean;
};

function ComposeMessageToolbar({
  body,
  setBody,
  textareaRef,
  disabled,
}: ComposeMessageToolbarProps) {
  const selectionRef = useRef({ start: 0, end: 0 });
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  const saveSelection = () => {
    const el = textareaRef.current;
    if (el) {
      selectionRef.current = {
        start: el.selectionStart,
        end: el.selectionEnd,
      };
    } else {
      selectionRef.current = { start: body.length, end: body.length };
    }
  };

  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    const { start, end } = selectionRef.current;
    setBody((prev) => {
      const next = prev.slice(0, start) + text + prev.slice(end);
      const pos = start + text.length;
      requestAnimationFrame(() => {
        el?.focus();
        el?.setSelectionRange(pos, pos);
        selectionRef.current = { start: pos, end: pos };
      });
      return next;
    });
  };

  const handleInsertEmoji = (emoji: string) => {
    insertAtCursor(emoji);
    setEmojiOpen(false);
  };

  const handleInsertLink = () => {
    const url = normalizeUrl(linkUrl);
    if (!url) return;
    insertAtCursor(formatLinkInsert(url, linkText));
    setLinkUrl("");
    setLinkText("");
    setLinkOpen(false);
  };

  return (
    <div className="absolute right-2 bottom-2 flex items-center gap-0.5">
      <Popover
        open={emojiOpen}
        onOpenChange={(open) => {
          if (open) saveSelection();
          setEmojiOpen(open);
        }}
      >
        <PopoverTrigger
          render={
            <InputGroupButton
              type="button"
              variant="ghost"
              size="icon-xs"
              disabled={disabled}
              aria-label="Insert emoji"
            />
          }
        >
          <HugeiconsIcon icon={SmileIcon} strokeWidth={2} />
        </PopoverTrigger>
        <PopoverContent side="top" align="end" className="w-auto p-2">
          <div className="grid grid-cols-8 gap-0.5">
            {COMPOSE_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="flex size-7 items-center justify-center rounded-md text-base transition-colors hover:bg-muted"
                onClick={() => handleInsertEmoji(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* <InputGroupButton
        type="button"
        variant="ghost"
        size="icon-xs"
        disabled
        aria-label="Attach file (coming soon)"
        title="Attachments coming soon"
      >
        <HugeiconsIcon icon={Attachment01Icon} strokeWidth={2} />
      </InputGroupButton> */}

      <Popover
        open={linkOpen}
        onOpenChange={(open) => {
          if (open) saveSelection();
          setLinkOpen(open);
        }}
      >
        <PopoverTrigger
          render={
            <InputGroupButton
              type="button"
              variant="ghost"
              size="icon-xs"
              disabled={disabled}
              aria-label="Insert link"
            />
          }
        >
          <HugeiconsIcon icon={Link01Icon} strokeWidth={2} />
        </PopoverTrigger>
        <PopoverContent side="top" align="end" className="w-72 gap-3 p-3">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="compose-link-url"
              className="text-xs font-medium text-foreground"
            >
              URL
            </label>
            <Input
              id="compose-link-url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleInsertLink();
                }
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="compose-link-text"
              className="text-xs font-medium text-foreground"
            >
              Text (optional)
            </label>
            <Input
              id="compose-link-text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="Link label"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleInsertLink();
                }
              }}
            />
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            className="w-full"
            disabled={!linkUrl.trim()}
            onClick={handleInsertLink}
          >
            Insert link
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function ComposeModal({ initial, onClose, onSent }: ComposeModalProps) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
                ref={textareaRef}
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
              <ComposeMessageToolbar
                body={body}
                setBody={setBody}
                textareaRef={textareaRef}
                disabled={pending}
              />
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
