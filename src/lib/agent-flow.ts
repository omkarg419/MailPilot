/** User asked for both a meeting and an email in one request. */
export function isCombinedMeetingEmailRequest(text: string): boolean {
  const lower = text.toLowerCase();
  const hasMeeting =
    /\b(meeting|meet|calendar|book|schedule|scheduled|event|appointment)\b/.test(
      lower,
    );
  const hasEmail =
    /\b(email|e-mail|mail|send|write|draft|notify|message|inform|tell)\b/.test(
      lower,
    );
  return hasMeeting && hasEmail;
}

/** Auto follow-up after calendar booking — exempt from agent rate limit. */
export function isPostBookingFollowUpPrompt(text: string): boolean {
  const trimmed = text.trim();
  return (
    trimmed.startsWith('I booked the meeting "') &&
    trimmed.includes("Please draft the email to ") &&
    trimmed.endsWith("as I originally requested.")
  );
}

export function buildPostBookingEmailPrompt(event: {
  title: string;
  start: string;
  end: string;
  attendees?: string[];
  timeLabel: string;
}): string {
  const recipient =
    event.attendees && event.attendees.length > 0
      ? event.attendees.join(", ")
      : "the attendee";

  return `I booked the meeting "${event.title}" (${event.timeLabel}). Please draft the email to ${recipient} about this meeting as I originally requested.`;
}
