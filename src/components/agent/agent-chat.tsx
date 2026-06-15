"use client";

import { useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUp02Icon, Loading03Icon } from "@hugeicons/core-free-icons";

import { AgentCalendarBlock } from "@/components/agent/agent-calendar-block";
import { AgentComposeBlock } from "@/components/agent/agent-compose-block";
import { AgentTextBlock } from "@/components/agent/agent-text-block";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  buildPostBookingEmailPrompt,
  isCombinedMeetingEmailRequest,
} from "@/lib/agent-flow";
import { formatCalendarEventRange } from "@/lib/calendar-display";

import type {
  AgentChatContext,
  AgentStreamEvent,
  AssistantBlock,
  CalendarBlockStatus,
  ClientChatMessage,
  ComposeBlockStatus,
  UiMessage,
  UiUserMessage,
} from "@/types/agent-chat";
import { assistantBlocksToHistoryContent } from "@/types/agent-chat";

const SUGGESTIONS = [
  {
    label: "Summarize my unread inbox",
    prompt: "Summarize my unread inbox",
  },
  {
    label: "Draft a professional email",
    prompt:
      "Draft a professional email to alex@example.com about our project update",
  },
  {
    label: "Book a 30-minute meeting",
    prompt: "Book a 30-minute meeting tomorrow at 3pm",
  },
] as const;

type AgentChatProps = {
  userName?: string;
  userEmail?: string;
  context?: AgentChatContext;
  className?: string;
};

function parseSseChunk(
  buffer: string,
  onEvent: (event: AgentStreamEvent) => void,
): string {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";

  for (const part of parts) {
    const line = part.split("\n").find((l) => l.startsWith("data: "));
    if (!line) continue;
    try {
      onEvent(JSON.parse(line.slice(6)) as AgentStreamEvent);
    } catch {
      // ignore malformed chunks
    }
  }

  return rest;
}

function uiMessagesToHistory(messages: UiMessage[]): ClientChatMessage[] {
  return messages.map((m) =>
    m.role === "user"
      ? { role: "user", content: m.content }
      : { role: "assistant", content: assistantBlocksToHistoryContent(m.blocks) },
  );
}

function appendTextBlock(blocks: AssistantBlock[], content: string): AssistantBlock[] {
  if (!content) return blocks;
  const next = [...blocks];
  const last = next[next.length - 1];
  if (last?.kind === "text") {
    next[next.length - 1] = { kind: "text", content: last.content + content };
    return next;
  }
  next.push({ kind: "text", content });
  return next;
}

function applyStreamEvent(
  blocks: AssistantBlock[],
  event: AgentStreamEvent,
): AssistantBlock[] {
  switch (event.type) {
    case "text":
      return appendTextBlock(blocks, event.content);
    case "calendar_start":
      return [
        ...blocks,
        {
          kind: "calendar",
          id: event.id,
          title: event.title,
          start: event.start,
          end: event.end,
          attendees: event.attendees,
          description: event.description,
          status: "proposed",
        },
      ];
    case "calendar_status":
      return blocks.map((b) =>
        b.kind === "calendar" && b.id === event.id
          ? { ...b, status: event.status, message: event.message }
          : b,
      );
    case "compose_start":
      return [
        ...blocks,
        {
          kind: "compose",
          id: event.id,
          to: event.to,
          subject: event.subject,
          body: "",
          threadId: event.threadId,
          streaming: true,
          status: "proposed",
        },
      ];
    case "compose_body_delta":
      return blocks.map((b) =>
        b.kind === "compose" && b.id === event.id
          ? { ...b, body: b.body + event.content }
          : b,
      );
    case "compose_end":
      return blocks.map((b) =>
        b.kind === "compose" && b.id === event.id
          ? { ...b, streaming: false }
          : b,
      );
    case "compose_status":
      return blocks.map((b) =>
        b.kind === "compose" && b.id === event.id
          ? { ...b, status: event.status, message: event.message, streaming: false }
          : b,
      );
    default:
      return blocks;
  }
}

function updateCalendarStatus(
  blocks: AssistantBlock[],
  id: string,
  status: CalendarBlockStatus,
  message?: string,
): AssistantBlock[] {
  return blocks.map((b) =>
    b.kind === "calendar" && b.id === id ? { ...b, status, message } : b,
  );
}

function updateComposeField(
  blocks: AssistantBlock[],
  id: string,
  field: "body" | "to" | "subject",
  value: string,
): AssistantBlock[] {
  return blocks.map((b) =>
    b.kind === "compose" && b.id === id ? { ...b, [field]: value } : b,
  );
}

function updateComposeStatus(
  blocks: AssistantBlock[],
  id: string,
  status: ComposeBlockStatus,
  message?: string,
): AssistantBlock[] {
  return blocks.map((b) =>
    b.kind === "compose" && b.id === id
      ? { ...b, status, message, streaming: false }
      : b,
  );
}

function isAssistantEmpty(blocks: AssistantBlock[]): boolean {
  return blocks.length === 0 || blocks.every((b) => b.kind === "text" && !b.content);
}

function getPrecedingUserMessage(
  messages: UiMessage[],
  assistantMessageId: string,
): string | null {
  const idx = messages.findIndex((m) => m.id === assistantMessageId);
  if (idx <= 0) return null;

  for (let i = idx - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg?.role === "user") return msg.content;
  }
  return null;
}

function getFirstName(userName?: string, userEmail?: string): string {
  const fromName = userName?.trim().split(/\s+/)[0];
  if (fromName) return fromName;
  const fromEmail = userEmail?.split("@")[0];
  if (fromEmail) return fromEmail;
  return "there";
}

function formatToolStatus(name: string, input: unknown): string {
  if (name === "check_calendar_availability") return "Checking Calendar…";
  if (name === "propose_calendar_event") return "Creating Event…";
  if (name === "draft_email" || name === "stream_email_body_chunk") {
    return "Drafting Email…";
  }
  if (name === "execute_operation") {
    const plugin = (input as { plugin?: string })?.plugin;
    if (plugin === "googlecalendar") return "Checking Calendar…";
    if (plugin === "gmail") return "Searching Gmail…";
    return "Working…";
  }
  return "Working…";
}

type AgentInputAreaProps = {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isStreaming: boolean;
  showSuggestions: boolean;
  onSuggestionClick: (prompt: string) => void;
};

function AgentInputArea({
  input,
  onInputChange,
  onSubmit,
  isStreaming,
  showSuggestions,
  onSuggestionClick,
}: AgentInputAreaProps) {
  return (
    <div className="mx-auto w-full max-w-[800px] px-4">
      <form onSubmit={onSubmit} className="relative">
        <Textarea
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Ask MailPilot Agent…"
          disabled={isStreaming}
          rows={1}
          className={cn(
            "min-h-12 max-h-40 resize-none rounded-full border-border bg-background py-3.5 pr-14 pl-4",
            "text-[15px] shadow-sm transition-shadow rounded-full",
            "focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20 rounded-full",
          )}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e);
            }
          }}
        />
        <Button
          type="submit"
          size="icon-sm"
          disabled={isStreaming || !input.trim()}
          className="absolute right-2 bottom-2 size-9 rounded-full"
          aria-label="Send message"
        >
          <HugeiconsIcon icon={ArrowUp02Icon} strokeWidth={2} />
        </Button>
      </form>

      {showSuggestions ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
          {SUGGESTIONS.map(({ label, prompt }) => (
            <button
              key={label}
              type="button"
              disabled={isStreaming}
              onClick={() => onSuggestionClick(prompt)}
              className={cn(
                "rounded-full border border-border bg-muted/30 px-4 py-2 text-sm text-foreground",
                "transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md hover:shadow-primary/10",
                "disabled:pointer-events-none disabled:opacity-50",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AgentChat({
  userName,
  userEmail,
  context,
  className,
}: AgentChatProps) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  const firstName = getFirstName(userName, userEmail);
  const isEmpty = messages.length === 0;

  const nextId = () => {
    idRef.current += 1;
    return String(idRef.current);
  };

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    setError(null);
    setToolStatus(null);

    const userMessage: UiUserMessage = {
      id: nextId(),
      role: "user",
      content: trimmed,
    };
    const assistantId = nextId();
    const history = [...uiMessagesToHistory(messages), { role: "user" as const, content: trimmed }];

    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantId, role: "assistant", blocks: [] },
    ]);
    setInput("");
    setIsStreaming(true);
    scrollToBottom();

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          context: {
            ...context,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        }),
      });

      if (res.status === 401) {
        throw new Error("Please sign in to use the agent.");
      }
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        buffer = parseSseChunk(buffer, (event) => {
          if (
            event.type === "text" ||
            event.type === "calendar_start" ||
            event.type === "calendar_status" ||
            event.type === "compose_start" ||
            event.type === "compose_body_delta" ||
            event.type === "compose_end" ||
            event.type === "compose_status"
          ) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId && m.role === "assistant"
                  ? { ...m, blocks: applyStreamEvent(m.blocks, event) }
                  : m,
              ),
            );
            scrollToBottom();
          } else if (event.type === "tool_start") {
            setToolStatus(formatToolStatus(event.name, event.input));
          } else if (event.type === "tool_end") {
            setToolStatus(null);
          } else if (event.type === "error") {
            setError(event.message);
          }
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setIsStreaming(false);
      setToolStatus(null);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const patchAssistantBlocks = (
    messageId: string,
    updater: (blocks: AssistantBlock[]) => AssistantBlock[],
  ) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId && m.role === "assistant"
          ? { ...m, blocks: updater(m.blocks) }
          : m,
      ),
    );
  };

  const handleCalendarBooked = (
    assistantMessageId: string,
    event: {
      title: string;
      start: string;
      end: string;
      attendees?: string[];
    },
  ) => {
    const userText = getPrecedingUserMessage(messages, assistantMessageId);
    if (!userText || !isCombinedMeetingEmailRequest(userText)) return;

    void sendMessage(
      buildPostBookingEmailPrompt({
        ...event,
        timeLabel: formatCalendarEventRange(event.start, event.end),
      }),
    );
  };

  const inputArea = (
    <AgentInputArea
      input={input}
      onInputChange={setInput}
      onSubmit={onSubmit}
      isStreaming={isStreaming}
      showSuggestions={isEmpty}
      onSuggestionClick={(prompt) => void sendMessage(prompt)}
    />
  );

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-8">
          <div className="mb-10 max-w-lg text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Hey there, {firstName}
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              What can I help you with today?
            </p>
            <p className="mt-2 text-sm text-muted-foreground/80">
              Natural language control for Gmail and Google Calendar.
            </p>
          </div>
          {inputArea}
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto flex w-full max-w-[850px] flex-col gap-6 px-4 py-8">
              {messages.map((message) => {
                if (message.role === "user") {
                  return (
                    <div key={message.id} className="flex justify-end">
                      <div className="max-w-[85%] overflow-hidden rounded-[1.2rem] bg-primary px-4 py-2 text-[15px] text-primary-foreground">
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  );
                }

                const empty = isAssistantEmpty(message.blocks);

                return (
                  <div
                    key={message.id}
                    className="flex w-full flex-col gap-4"
                  >
                    {empty && isStreaming ? (
                      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <HugeiconsIcon
                          icon={Loading03Icon}
                          strokeWidth={2}
                          className="size-4 animate-spin"
                        />
                        Thinking…
                      </span>
                    ) : null}
                    {message.blocks.map((block, index) => {
                      if (block.kind === "text") {
                        return (
                          <AgentTextBlock
                            key={`${message.id}-text-${index}`}
                            content={block.content}
                          />
                        );
                      }
                      if (block.kind === "calendar") {
                        return (
                          <AgentCalendarBlock
                            key={block.id}
                            {...block}
                            onStatusChange={(id, status, msg) =>
                              patchAssistantBlocks(message.id, (blocks) =>
                                updateCalendarStatus(blocks, id, status, msg),
                              )
                            }
                            onBooked={(event) =>
                              handleCalendarBooked(message.id, event)
                            }
                          />
                        );
                      }
                      return (
                        <AgentComposeBlock
                          key={block.id}
                          {...block}
                          onStatusChange={(id, status, msg) =>
                            patchAssistantBlocks(message.id, (blocks) =>
                              updateComposeStatus(blocks, id, status, msg),
                            )
                          }
                          onBodyChange={(id, body) =>
                            patchAssistantBlocks(message.id, (blocks) =>
                              updateComposeField(blocks, id, "body", body),
                            )
                          }
                          onToChange={(id, to) =>
                            patchAssistantBlocks(message.id, (blocks) =>
                              updateComposeField(blocks, id, "to", to),
                            )
                          }
                          onSubjectChange={(id, subject) =>
                            patchAssistantBlocks(message.id, (blocks) =>
                              updateComposeField(blocks, id, "subject", subject),
                            )
                          }
                        />
                      );
                    })}
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>
          </div>

          <div className="shrink-0 border-t border-border/50 bg-background/80 py-4 backdrop-blur-sm">
            {toolStatus ? (
              <p className="mx-auto mb-3 flex w-full max-w-[800px] items-center gap-2 px-4 text-sm text-muted-foreground">
                <HugeiconsIcon
                  icon={Loading03Icon}
                  strokeWidth={2}
                  className="size-3.5 animate-spin text-primary"
                />
                {toolStatus}
              </p>
            ) : null}
            {error ? (
              <div className="mx-auto mb-3 w-full max-w-[800px] px-4">
                <Alert variant="destructive">
                  <AlertTitle>Agent error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            ) : null}
            {inputArea}
          </div>
        </>
      )}

      {isEmpty && error ? (
        <div className="mx-auto mt-4 w-full max-w-[800px] px-4 pb-4">
          <Alert variant="destructive">
            <AlertTitle>Agent error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {isEmpty && toolStatus ? (
        <p className="mx-auto mt-4 flex w-full max-w-[800px] items-center justify-center gap-2 px-4 pb-4 text-sm text-muted-foreground">
          <HugeiconsIcon
            icon={Loading03Icon}
            strokeWidth={2}
            className="size-3.5 animate-spin text-primary"
          />
          {toolStatus}
        </p>
      ) : null}
    </div>
  );
}
