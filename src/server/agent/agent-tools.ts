import "server-only";

import { randomUUID } from "crypto";

import {
  checkCalendarAvailability,
  findCalendarConflict,
  formatCalendarAvailableMessage,
  formatCalendarConflictMessage,
} from "@/server/calendar/conflicts";
import type { AgentStreamEvent } from "@/types/agent-chat";

export type SseSender = (event: AgentStreamEvent) => void;

export type UiAgentToolOptions = {
  tenantId: string;
  timeZone?: string;
};

const CALENDAR_DATETIME_PROP = {
  type: "string" as const,
  description:
    "Local datetime YYYY-MM-DDTHH:mm:ss (user timezone) or RFC3339 with offset",
};

export const CHECK_CALENDAR_AVAILABILITY_TOOL = {
  name: "check_calendar_availability",
  description:
    "Check if a time slot is free on the user's primary calendar. Use for questions like 'am I free at 3pm?'. Do NOT use execute_operation getAvailability for this.",
  input_schema: {
    type: "object" as const,
    properties: {
      start: CALENDAR_DATETIME_PROP,
      end: CALENDAR_DATETIME_PROP,
    },
    required: ["start", "end"],
  },
};

export const PROPOSE_CALENDAR_EVENT_TOOL = {
  name: "propose_calendar_event",
  description:
    "Show a calendar event card if the time slot is free. If the slot is already booked, only a text message is shown (no card). Does NOT create the event yet.",
  input_schema: {
    type: "object" as const,
    properties: {
      title: { type: "string" },
      start: CALENDAR_DATETIME_PROP,
      end: CALENDAR_DATETIME_PROP,
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

export type CheckCalendarAvailabilityInput = {
  start: string;
  end: string;
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

function availabilityCheckErrorMessage(err: unknown): string {
  const detail = err instanceof Error ? err.message : "Unknown error";
  return `Couldn't verify calendar availability. ${detail}`;
}

export async function handleUiAgentTool(
  toolName: string,
  input: unknown,
  send: SseSender,
  options: UiAgentToolOptions,
): Promise<unknown> {
  if (toolName === "check_calendar_availability") {
    const data = input as CheckCalendarAvailabilityInput;

    try {
      const result = await checkCalendarAvailability(
        options.tenantId,
        "primary",
        data.start,
        data.end,
        options.timeZone,
      );

      if (!result.available) {
        const message = formatCalendarConflictMessage(result.existingEvent);
        send({ type: "text", content: message });
        return {
          ok: true,
          available: false,
          existingEvent: result.existingEvent,
          message,
        };
      }

      const message = formatCalendarAvailableMessage();
      send({ type: "text", content: message });
      return { ok: true, available: true, message };
    } catch (err) {
      const message = availabilityCheckErrorMessage(err);
      send({ type: "text", content: message });
      return { ok: false, error: message };
    }
  }

  if (toolName === "propose_calendar_event") {
    const data = input as ProposeCalendarInput;

    try {
      const conflict = await findCalendarConflict(
        options.tenantId,
        "primary",
        data.start,
        data.end,
        options.timeZone,
      );

      if (conflict.conflict) {
        const message = formatCalendarConflictMessage(conflict.title);
        send({ type: "text", content: message });
        return {
          ok: false,
          conflict: true,
          existingEvent: conflict.title,
          message,
        };
      }
    } catch (err) {
      const message = availabilityCheckErrorMessage(err);
      send({ type: "text", content: message });
      return { ok: false, error: message };
    }

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
  CHECK_CALENDAR_AVAILABILITY_TOOL,
  PROPOSE_CALENDAR_EVENT_TOOL,
  DRAFT_EMAIL_TOOL,
  STREAM_EMAIL_BODY_CHUNK_TOOL,
] as const;
