import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { env } from "@/env";
import {
  extractClassifierJson,
  isExactAgentSuggestionPrompt,
  isLikelyMailCalendarIntent,
} from "@/lib/agent-guardrails";

const GUARD_MODEL = env.ANTHROPIC_GUARD_MODEL ?? "claude-haiku-4-5";

export type GuardrailResult =
  | { allowed: true }
  | { allowed: false; reason: string };

const CLASSIFIER_SYSTEM = `You are a strict intent classifier for MailPilot.
MailPilot ONLY helps with Gmail and Google Calendar tasks.

ALLOWED (respond allowed: true):
- Summarize unread inbox or specific emails/threads
- Search or read mail
- Draft, compose, or send emails (including follow-ups)
- Schedule meetings / calendar events
- Check calendar availability
- Combined flows: book meeting then email attendees
- Mark emails read/unread

NOT ALLOWED (respond allowed: false):
- General knowledge, coding, homework, jokes, stories
- Politics, health, finance advice unrelated to mail/calendar
- Anything not actionable via Gmail or Google Calendar

Examples:
User: "Summarize my unread inbox" → {"allowed":true}
User: "Book a 30-minute meeting tomorrow at 3pm" → {"allowed":true}
User: "Book a meeting with x@gmail.com at 5pm and send email" → {"allowed":true}
User: "Draft a professional email to alex@example.com about project update" → {"allowed":true}
User: "What's on my calendar today?" → {"allowed":true}
User: "Find emails from John about the invoice" → {"allowed":true}
User: "Tell me a joke" → {"allowed":false,"reason":"I can only help with Gmail and Google Calendar in MailPilot."}
User: "Write me Python code" → {"allowed":false,"reason":"I can only help with Gmail and Google Calendar in MailPilot."}

Reply with ONLY valid JSON, no markdown:
{"allowed":true}
or
{"allowed":false,"reason":"short user-facing message"}`;

function allow(): GuardrailResult {
  return { allowed: true };
}

function deny(reason: string): GuardrailResult {
  return {
    allowed: false,
    reason,
  };
}

export async function classifyAgentMessage(
  message: string,
): Promise<GuardrailResult> {
  const trimmed = message.trim();
  if (!trimmed) {
    return deny("Please enter a message about email or calendar.");
  }

  if (isExactAgentSuggestionPrompt(trimmed) || isLikelyMailCalendarIntent(trimmed)) {
    return allow();
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const res = await client.messages.create({
    model: GUARD_MODEL,
    max_tokens: 120,
    temperature: 0,
    system: CLASSIFIER_SYSTEM,
    messages: [{ role: "user", content: trimmed }],
  });

  const text =
    res.content[0]?.type === "text" ? res.content[0].text.trim() : "";

  try {
    const parsed = JSON.parse(extractClassifierJson(text)) as {
      allowed?: boolean;
      reason?: string;
    };

    if (parsed.allowed === true) return allow();

    if (isLikelyMailCalendarIntent(trimmed)) {
      return allow();
    }

    return deny(
      parsed.reason ??
        "I can only help with Gmail and Google Calendar tasks in MailPilot.",
    );
  } catch {
    if (isLikelyMailCalendarIntent(trimmed)) {
      return allow();
    }

    return allow();
  }
}
