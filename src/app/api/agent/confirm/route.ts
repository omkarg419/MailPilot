import { AgentAccessDeniedError, assertAgentAccess } from "@/server/agent/access";
import { auth } from "@/server/auth";
import { executeOperation } from "@/server/agent/execute-operation";
import {
  findCalendarConflict,
  formatCalendarConflictMessage,
} from "@/server/calendar/conflicts";
import { toGoogleCalendarEventTime } from "@/server/calendar/utils";
import { buildRawMessage } from "@/server/gmail/utils";
import type { AgentConfirmRequestBody } from "@/types/agent-chat";

export const runtime = "nodejs";

function parseRecipients(raw: string): string[] {
  return raw
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await assertAgentAccess(session.user.id, session.user.email);
  } catch (err) {
    if (err instanceof AgentAccessDeniedError) {
      return Response.json(
        { error: err.message, code: "AGENT_ACCESS_DENIED" },
        { status: 403 },
      );
    }
    throw err;
  }

  let body: AgentConfirmRequestBody;
  try {
    body = (await req.json()) as AgentConfirmRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const tenantId = session.user.id;

  if (body.action === "send_email" || body.action === "save_draft") {
    const { to, subject, body: emailBody, threadId } = body.payload;
    const recipients = parseRecipients(to);
    if (recipients.length === 0) {
      return Response.json({ error: "Add at least one recipient." }, { status: 400 });
    }

    const raw = buildRawMessage({ to: recipients, subject, body: emailBody });

    if (body.action === "send_email") {
      const result = await executeOperation(tenantId, {
        plugin: "gmail",
        operation: "api.messages.send",
        params: { raw, threadId },
      });
      if (!result.ok) {
        return Response.json({ error: result.error, status: "failed" }, { status: 400 });
      }
      return Response.json({ status: "sent", result: result.result });
    }

    const result = await executeOperation(tenantId, {
      plugin: "gmail",
      operation: "api.drafts.create",
      params: { draft: { message: { raw, threadId } } },
    });
    if (!result.ok) {
      return Response.json({ error: result.error, status: "failed" }, { status: 400 });
    }
    return Response.json({ status: "draft", result: result.result });
  }

  if (body.action === "create_calendar_event") {
    const { title, start, end, attendees, description, timeZone } = body.payload;
    const calendarId = body.payload.calendarId ?? "primary";

    let eventStart;
    let eventEnd;
    try {
      eventStart = toGoogleCalendarEventTime(start, timeZone);
      eventEnd = toGoogleCalendarEventTime(end, timeZone);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid event time.";
      return Response.json({ error: message, status: "failed" }, { status: 400 });
    }

    const eventAttendees = attendees
      ?.map((email) => email.trim())
      .filter(Boolean)
      .map((email) => ({ email }));

    try {
      const conflict = await findCalendarConflict(
        tenantId,
        calendarId,
        start,
        end,
        timeZone,
      );
      if (conflict.conflict) {
        return Response.json(
          {
            error: formatCalendarConflictMessage(conflict.title),
            status: "failed",
          },
          { status: 409 },
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not verify calendar availability.";
      return Response.json({ error: message, status: "failed" }, { status: 400 });
    }

    const result = await executeOperation(tenantId, {
      plugin: "googlecalendar",
      operation: "api.events.create",
      params: {
        calendarId,
        event: {
          summary: title,
          description: description ?? "",
          start: eventStart,
          end: eventEnd,
          ...(eventAttendees?.length ? { attendees: eventAttendees } : {}),
        },
      },
    });
    if (!result.ok) {
      return Response.json({ error: result.error, status: "failed" }, { status: 400 });
    }
    return Response.json({ status: "booked", result: result.result });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
