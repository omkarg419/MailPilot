/** Shared agent suggestion prompts — used in UI chips and guardrail fast-path. */
export const AGENT_SUGGESTION_PROMPTS = [
  "Summarize my unread inbox",
  "Draft a professional email to alex@example.com about our project update",
  "Book a 30-minute meeting tomorrow at 3pm",
] as const;

export const AGENT_SUGGESTIONS = [
  {
    label: "Summarize my unread inbox",
    prompt: AGENT_SUGGESTION_PROMPTS[0],
  },
  {
    label: "Draft a professional email",
    prompt: AGENT_SUGGESTION_PROMPTS[1],
  },
  {
    label: "Book a 30-minute meeting",
    prompt: AGENT_SUGGESTION_PROMPTS[2],
  },
] as const;

const MAIL_CALENDAR_INTENT_PATTERNS = [
  /\b(summarize|summary|summarise)\b/i,
  /\b(unread|inbox)\b/i,
  /\b(email|e-mail|mail|gmail|thread|inbox|draft|compose)\b/i,
  /\b(send|reply|forward|write)\b.*\b(email|mail|message)\b/i,
  /\b(email|mail|message)\b.*\b(send|reply|forward|draft|compose|write)\b/i,
  /\b(book|schedule|create|set up|setup|reschedule|cancel)\b.*\b(meeting|event|appointment|call|slot)\b/i,
  /\b(meeting|calendar|event|schedule|availability|appointment|attendee)\b/i,
  /\b(what'?s on|show)\b.*\bcalendar\b/i,
  /\b(find|search|look for|check)\b.*\b(email|mail|message|thread|inbox)\b/i,
  /\b(mark|read|unread|archive|trash|delete)\b.*\b(email|mail|message|thread)\b/i,
  /\b(free|busy|available)\b.*\b(time|slot|calendar)\b/i,
  /\S+@\S+\.\S+/,
  /\b\d{1,2}(:\d{2})?\s?(am|pm)\b/i,
  /\b(tomorrow|today|next\s+(week|monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i,
  /\b\d+\s*-\s*(minute|min|hour)\b/i,
] as const;

const OFF_TOPIC_PATTERNS = [
  /\b(python|javascript|typescript|code|coding|programming|homework|essay)\b/i,
  /\b(joke|poem|story|recipe|weather|stock|crypto)\b/i,
  /\b(who won|world cup|election|president)\b/i,
] as const;

export function isExactAgentSuggestionPrompt(message: string): boolean {
  const trimmed = message.trim();
  return AGENT_SUGGESTION_PROMPTS.some((prompt) => prompt === trimmed);
}

/** Fast-path: likely Gmail/Calendar intent without calling the classifier. */
export function isLikelyMailCalendarIntent(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return false;

  if (isExactAgentSuggestionPrompt(trimmed)) return true;

  const lower = trimmed.toLowerCase();
  if (OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(lower))) {
    return false;
  }

  return MAIL_CALENDAR_INTENT_PATTERNS.some((pattern) => pattern.test(lower));
}

export function extractClassifierJson(text: string): string {
  const fencePattern = /```(?:json)?\s*([\s\S]*?)```/i;
  const fenced = fencePattern.exec(text);
  if (fenced?.[1]) return fenced[1].trim();

  const bracePattern = /\{[\s\S]*\}/;
  const brace = bracePattern.exec(text);
  return brace?.[0]?.trim() ?? text.trim();
}
