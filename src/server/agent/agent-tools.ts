import "server-only";

import { randomUUID } from "crypto";

import type { AgentStreamEvent } from "@/types/agent-chat";

export type SseSender = (event: AgentStreamEvent) => void;

export const PROPOSE_CALENDAR_EVENT_TOOL = {
  name: "propose_calendar_event",
  description:
    "Show a calendar event card in the UI for the user to review and book. Does NOT create the event yet.",
  input_schema: {
    type: "object" as const,
    properties: {
      title: { type: "string" },
      start: {
        type: "string",
        description:
          'Local datetime YYYY-MM-DDTHH:mm:ss (user timezone) or RFC3339 with offset',
      },
      end: {
        type: "string",
        description:
          'Local datetime YYYY-MM-DDTHH:mm:ss (user timezone) or RFC3339 with offset',
      },
      attendees: {
        type: "array",
        items: { type: "string" },
        description: "Email addresses",
      },
      description: { type: "string" },
    },
    required: ["title", "start", "end"],
  },
};

export const DRAFT_EMAIL_TOOL = {
  name: "draft_email",
  description:
    "Show an inline compose card with To and Subject. Body streams in the card. Does NOT send email.",
  input_schema: {
    type: "object" as const,
    properties: {
      to: { type: "string" },
      subject: { type: "string" },
      body: { type: "string", description: "Full email body text to stream into the card" },
      threadId: { type: "string" },
    },
    required: ["to", "subject", "body"],
  },
};

export const STREAM_EMAIL_BODY_CHUNK_TOOL = {
  name: "stream_email_body_chunk",
  description:
    "Append text to an open compose card body. Use after draft_email only if you need extra chunks.",
  input_schema: {
    type: "object" as const,
    properties: {
      composeId: { type: "string" },
      content: { type: "string" },
    },
    required: ["composeId", "content"],
  },
};

export type ProposeCalendarInput = {
  title: string;
  start: string;
  end: string;
  attendees?: string[];
  description?: string;
};

export type DraftEmailInput = {
  to: string;
  subject: string;
  body: string;
  threadId?: string;
};

export type StreamEmailBodyInput = {
  composeId: string;
  content: string;
};

function chunkText(text: string, size = 48): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks.length ? chunks : [""];
}

export function handleUiAgentTool(
  toolName: string,
  input: unknown,
  send: SseSender,
): unknown {
  if (toolName === "propose_calendar_event") {
    const data = input as ProposeCalendarInput;
    const id = randomUUID();
    send({
      type: "calendar_start",
      id,
      title: data.title,
      start: data.start,
      end: data.end,
      attendees: data.attendees,
      description: data.description,
    });
    send({ type: "calendar_end", id });
    return {
      ok: true,
      calendarId: id,
      message: "Calendar card shown. User must click Book to create the event.",
    };
  }

  if (toolName === "draft_email") {
    const data = input as DraftEmailInput;
    const id = randomUUID();
    send({
      type: "compose_start",
      id,
      to: data.to,
      subject: data.subject,
      threadId: data.threadId,
    });
    for (const chunk of chunkText(data.body)) {
      send({ type: "compose_body_delta", id, content: chunk });
    }
    send({ type: "compose_end", id });
    return {
      ok: true,
      composeId: id,
      message: "Compose card shown. User must click Send to send the email.",
    };
  }

  if (toolName === "stream_email_body_chunk") {
    const data = input as StreamEmailBodyInput;
    send({ type: "compose_body_delta", id: data.composeId, content: data.content });
    return { ok: true };
  }

  return { ok: false, error: `Unknown UI tool: ${toolName}` };
}

export const UI_AGENT_TOOLS = [
  PROPOSE_CALENDAR_EVENT_TOOL,
  DRAFT_EMAIL_TOOL,
  STREAM_EMAIL_BODY_CHUNK_TOOL,
] as const;
