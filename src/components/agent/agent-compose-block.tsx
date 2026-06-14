"use client";

import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  Loading03Icon,
  MailSend01Icon,
  FloppyDiskIcon,
} from "@hugeicons/core-free-icons";

import { ComposeFormFields } from "@/components/mail/compose-form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ComposeBlockStatus } from "@/types/agent-chat";

export type AgentComposeBlockProps = {
  id: string;
  to: string;
  subject: string;
  body: string;
  threadId?: string;
  streaming: boolean;
  status: ComposeBlockStatus;
  message?: string;
  onStatusChange?: (
    id: string,
    status: ComposeBlockStatus,
    message?: string,
  ) => void;
  onBodyChange?: (id: string, body: string) => void;
  onToChange?: (id: string, to: string) => void;
  onSubjectChange?: (id: string, subject: string) => void;
};

export function AgentComposeBlock({
  id,
  to,
  subject,
  body,
  threadId,
  streaming,
  status,
  message,
  onStatusChange,
  onBodyChange,
  onToChange,
  onSubjectChange,
}: AgentComposeBlockProps) {
  const [localTo, setLocalTo] = useState(to);
  const [localSubject, setLocalSubject] = useState(subject);
  const [localBody, setLocalBody] = useState(body);
  const [isSending, setIsSending] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalTo(to);
  }, [to]);

  useEffect(() => {
    setLocalSubject(subject);
  }, [subject]);

  useEffect(() => {
    setLocalBody(body);
  }, [body]);

  useEffect(() => {
    if (streaming && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [localBody, streaming]);

  const isDone = status === "sent" || status === "failed";
  const canAct = !streaming && status === "proposed";

  async function confirmAction(action: "send_email" | "save_draft") {
    const setBusy = action === "send_email" ? setIsSending : setIsSavingDraft;
    setBusy(true);
    try {
      const res = await fetch("/api/agent/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          payload: {
            composeId: id,
            to: localTo,
            subject: localSubject,
            body: localBody,
            threadId,
          },
        }),
      });
      const data = (await res.json()) as { status?: string; error?: string };
      if (!res.ok) {
        onStatusChange?.(id, "failed", data.error ?? "Action failed.");
        return;
      }
      onStatusChange?.(
        id,
        action === "send_email" ? "sent" : "draft",
        action === "send_email" ? "Email sent." : "Draft saved.",
      );
    } catch {
      onStatusChange?.(id, "failed", "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="max-w-lg border-border bg-card shadow-sm">
      <CardHeader className="gap-2 pb-0">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold">Compose email</CardTitle>
          {status === "sent" && (
            <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-3.5" />
              Sent
            </Badge>
          )}
          {status === "draft" && (
            <Badge variant="secondary">Draft saved</Badge>
          )}
          {streaming && (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <HugeiconsIcon
                icon={Loading03Icon}
                strokeWidth={2}
                className="size-3.5 animate-spin"
              />
              Writing…
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 pt-2">
        <ComposeFormFields
          idPrefix={`agent-compose-${id}`}
          to={localTo}
          onToChange={(v) => {
            setLocalTo(v);
            onToChange?.(id, v);
          }}
          subject={localSubject}
          onSubjectChange={(v) => {
            setLocalSubject(v);
            onSubjectChange?.(id, v);
          }}
          body={localBody}
          onBodyChange={(v) => {
            setLocalBody(v);
            onBodyChange?.(id, v);
          }}
          disabled={isDone || isSending || isSavingDraft}
          compact
          bodyRef={bodyRef}
        />
        {message && (
          <p className="px-4 pb-2 text-xs text-muted-foreground">{message}</p>
        )}
      </CardContent>
      {canAct && (
        <CardFooter className="gap-2 border-t border-border pt-4">
          <Button
            type="button"
            size="sm"
            onClick={() => void confirmAction("send_email")}
            disabled={isSending || isSavingDraft}
          >
            {isSending ? (
              <>
                <HugeiconsIcon
                  icon={Loading03Icon}
                  strokeWidth={2}
                  className="size-4 animate-spin"
                />
                Sending…
              </>
            ) : (
              <>
                <HugeiconsIcon icon={MailSend01Icon} strokeWidth={2} className="size-4" />
                Send
              </>
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void confirmAction("save_draft")}
            disabled={isSending || isSavingDraft}
          >
            {isSavingDraft ? (
              <>
                <HugeiconsIcon
                  icon={Loading03Icon}
                  strokeWidth={2}
                  className="size-4 animate-spin"
                />
                Saving…
              </>
            ) : (
              <>
                <HugeiconsIcon icon={FloppyDiskIcon} strokeWidth={2} className="size-4" />
                Save draft
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
