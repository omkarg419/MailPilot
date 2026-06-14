export type ClientChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AgentChatContext = {
  threadId?: string;
  label?: string;
};

export type CalendarBlockStatus = "proposed" | "booked" | "failed";
export type ComposeBlockStatus = "proposed" | "draft" | "sent" | "failed";

export type AssistantBlock =
  | { kind: "text"; content: string }
  | {
      kind: "calendar";
      id: string;
      title: string;
      start: string;
      end: string;
      attendees?: string[];
      description?: string;
      status: CalendarBlockStatus;
      message?: string;
    }
  | {
      kind: "compose";
      id: string;
      to: string;
      subject: string;
      body: string;
      threadId?: string;
      streaming: boolean;
      status: ComposeBlockStatus;
      message?: string;
    };

export type UiUserMessage = { id: string; role: "user"; content: string };
export type UiAssistantMessage = {
  id: string;
  role: "assistant";
  blocks: AssistantBlock[];
};
export type UiMessage = UiUserMessage | UiAssistantMessage;

export type AgentStreamEvent =
  | { type: "text"; content: string }
  | { type: "tool_start"; name: string; input: unknown }
  | { type: "tool_end"; name: string; result: unknown }
  | {
      type: "calendar_start";
      id: string;
      title: string;
      start: string;
      end: string;
      attendees?: string[];
      description?: string;
    }
  | { type: "calendar_end"; id: string }
  | {
      type: "calendar_status";
      id: string;
      status: CalendarBlockStatus;
      message?: string;
    }
  | {
      type: "compose_start";
      id: string;
      to: string;
      subject: string;
      threadId?: string;
    }
  | { type: "compose_body_delta"; id: string; content: string }
  | { type: "compose_end"; id: string }
  | {
      type: "compose_status";
      id: string;
      status: ComposeBlockStatus;
      message?: string;
    }
  | { type: "done" }
  | { type: "error"; message: string };

export type AgentChatRequestBody = {
  messages: ClientChatMessage[];
  context?: AgentChatContext;
};

export type AgentConfirmAction = "send_email" | "save_draft" | "create_calendar_event";

export type AgentConfirmRequestBody =
  | {
      action: "send_email";
      payload: {
        composeId: string;
        to: string;
        subject: string;
        body: string;
        threadId?: string;
      };
    }
  | {
      action: "save_draft";
      payload: {
        composeId: string;
        to: string;
        subject: string;
        body: string;
        threadId?: string;
      };
    }
  | {
      action: "create_calendar_event";
      payload: {
        calendarId: string;
        title: string;
        start: string;
        end: string;
        attendees?: string[];
        description?: string;
        /** IANA timezone when start/end have no RFC3339 offset (e.g. from browser). */
        timeZone?: string;
      };
    };

export function encodeSseEvent(event: AgentStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function assistantBlocksToHistoryContent(blocks: AssistantBlock[]): string {
  const parts = blocks
    .filter((b): b is Extract<AssistantBlock, { kind: "text" }> => b.kind === "text")
    .map((b) => b.content.trim())
    .filter(Boolean);

  const hasCalendar = blocks.some((b) => b.kind === "calendar");
  const hasCompose = blocks.some((b) => b.kind === "compose");

  if (hasCalendar) parts.push("[Showed calendar event card]");
  if (hasCompose) parts.push("[Showed email compose card]");

  return parts.join("\n") || "[Showed interactive cards]";
}
