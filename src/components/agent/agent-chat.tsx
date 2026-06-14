"use client";

import { useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiUserIcon,
  ArrowUp02Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";

import { AgentCalendarBlock } from "@/components/agent/agent-calendar-block";
import { AgentComposeBlock } from "@/components/agent/agent-compose-block";
import { AgentTextBlock } from "@/components/agent/agent-text-block";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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

const EXAMPLE_PROMPTS = [
  "Summarize my unread inbox",
  "Draft a professional email to alex@example.com about our project update",
  "Book a 30-minute meeting tomorrow at 3pm",
] as const;

type AgentChatProps = {
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
    const line = part
      .split("\n")
      .find((l) => l.startsWith("data: "));
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

export function AgentChat({ context, className }: AgentChatProps) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

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
        body: JSON.stringify({ messages: history, context }),
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
                  ? {
                      ...m,
                      blocks: applyStreamEvent(m.blocks, event),
                    }
                  : m,
              ),
            );
            scrollToBottom();
          } else if (event.type === "tool_start") {
            setToolStatus(`Running ${event.name}…`);
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

  return (
    <Card
      className={cn(
        "flex h-[min(720px,calc(100svh-8rem))] flex-col border-border/80 bg-card/95 shadow-xl backdrop-blur-sm",
        className,
      )}
    >
      <CardHeader className="shrink-0 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <HugeiconsIcon icon={AiUserIcon} strokeWidth={2} className="size-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">MailPilot Agent</CardTitle>
            <p className="text-xs text-muted-foreground">
              Gmail &amp; Calendar actions via natural language
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-0">
        <ScrollArea className="min-h-0 flex-1 px-4 pt-4">
          {messages.length === 0 ? (
            <div className="flex flex-col gap-4 pb-4">
              <p className="text-sm text-muted-foreground">
                Ask me to search mail, summarize your inbox, draft emails, or
                book meetings.
              </p>
              <div className="flex flex-col gap-2">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={isStreaming}
                    onClick={() => void sendMessage(prompt)}
                    className="rounded-lg border border-border/70 bg-muted/40 px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-accent disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 pb-4">
              {messages.map((message) => {
                if (message.role === "user") {
                  return (
                    <div
                      key={message.id}
                      className="ml-auto max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  );
                }

                const empty = isAssistantEmpty(message.blocks);

                return (
                  <div key={message.id} className="mr-auto flex max-w-full flex-col gap-3">
                    {empty && isStreaming ? (
                      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <HugeiconsIcon
                          icon={Loading03Icon}
                          strokeWidth={2}
                          className="size-3.5 animate-spin"
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
          )}
        </ScrollArea>

        {error ? (
          <div className="px-4">
            <Alert variant="destructive">
              <AlertTitle>Agent error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : null}

        {toolStatus ? (
          <p className="px-4 text-xs text-muted-foreground">{toolStatus}</p>
        ) : null}

        <form
          onSubmit={onSubmit}
          className="flex shrink-0 gap-2 border-t border-border p-4"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask MailPilot Agent…"
            disabled={isStreaming}
            rows={2}
            className="min-h-0 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendMessage(input);
              }
            }}
          />
          <Button
            type="submit"
            size="icon-lg"
            disabled={isStreaming || !input.trim()}
            className="shrink-0 self-end rounded-lg"
            aria-label="Send message"
          >
            <HugeiconsIcon icon={ArrowUp02Icon} strokeWidth={2} />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
