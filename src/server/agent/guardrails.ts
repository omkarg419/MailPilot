import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { env } from "@/env";

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

Reply with ONLY valid JSON, no markdown:
{"allowed":true}
or
{"allowed":false,"reason":"short user-facing message"}`;

export async function classifyAgentMessage(
  message: string,
): Promise<GuardrailResult> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const res = await client.messages.create({
    model: GUARD_MODEL,
    max_tokens: 80,
    temperature: 0,
    system: CLASSIFIER_SYSTEM,
    messages: [{ role: "user", content: message.trim() }],
  });

  const text =
    res.content[0]?.type === "text" ? res.content[0].text.trim() : "";

  try {
    const parsed = JSON.parse(text) as {
      allowed?: boolean;
      reason?: string;
    };
    if (parsed.allowed === true) return { allowed: true };
    return {
      allowed: false,
      reason:
        parsed.reason ??
        "I can only help with Gmail and Google Calendar tasks in MailPilot.",
    };
  } catch {
    return {
      allowed: false,
      reason:
        "Could not verify your request. Please ask about email or calendar.",
    };
  }
}
