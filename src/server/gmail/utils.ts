import "server-only";

import type { Message, MessagePart } from "@corsair-dev/gmail";

/** Decode a base64url string (Gmail encodes message bodies this way). */
export function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return Buffer.from(normalized, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

/** Encode a UTF-8 string as base64url (used for outgoing RFC 2822 messages). */
export function encodeBase64Url(input: string): string {
  return Buffer.from(input, "utf-8").toString("base64url");
}

/** Case-insensitive header lookup over a Gmail MIME part's header list. */
export function getHeader(
  headers: MessagePart["headers"],
  name: string,
): string | undefined {
  if (!headers) return undefined;
  const match = headers.find(
    (h) => h.name?.toLowerCase() === name.toLowerCase(),
  );
  return match?.value ?? undefined;
}

/**
 * Parse a `From`/`To` style header into a display name and bare email.
 * Handles forms like `Jane Doe <jane@x.com>` and `jane@x.com`.
 */
export function parseAddress(raw: string | undefined): {
  name: string;
  email: string;
} {
  if (!raw) return { name: "", email: "" };
  const match = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(raw);
  if (match) {
    const name = match[1]?.replace(/^"|"$/g, "").trim() ?? "";
    const email = match[2]?.trim() ?? "";
    return { name: name || email, email };
  }
  const email = raw.trim();
  return { name: email, email };
}

/** Recursively walk a MIME tree collecting the first text/html and text/plain bodies. */
export function extractBody(payload: MessagePart | undefined): {
  html: string;
  text: string;
} {
  let html = "";
  let text = "";

  const walk = (part: MessagePart | undefined) => {
    if (!part) return;
    const mime = part.mimeType ?? "";
    const data = part.body?.data;
    if (data) {
      if (mime === "text/html" && !html) {
        html = decodeBase64Url(data);
      } else if (mime === "text/plain" && !text) {
        text = decodeBase64Url(data);
      }
    }
    if (part.parts) {
      for (const child of part.parts) walk(child);
    }
  };

  walk(payload);
  return { html, text };
}

export type MessageView = {
  id: string;
  threadId: string;
  fromName: string;
  fromEmail: string;
  to: string;
  subject: string;
  date: string | null;
  snippet: string;
  bodyHtml: string;
  bodyText: string;
  unread: boolean;
};

/** Normalize a raw Gmail API `Message` into a flat, client-friendly shape. */
export function normalizeMessage(message: Message): MessageView {
  const headers = message.payload?.headers;
  const from = parseAddress(getHeader(headers, "From"));
  const subject = getHeader(headers, "Subject") ?? "(no subject)";
  const to = getHeader(headers, "To") ?? "";
  const dateMs = message.internalDate ? Number(message.internalDate) : NaN;
  const { html, text } = extractBody(message.payload);

  return {
    id: message.id ?? "",
    threadId: message.threadId ?? "",
    fromName: from.name,
    fromEmail: from.email,
    to,
    subject,
    date: Number.isFinite(dateMs) ? new Date(dateMs).toISOString() : null,
    snippet: message.snippet ?? "",
    bodyHtml: html,
    bodyText: text,
    unread: message.labelIds?.includes("UNREAD") ?? false,
  };
}

/**
 * Build a base64url-encoded RFC 2822 message suitable for
 * `messages.send` / `drafts.create`.
 */
export function buildRawMessage(input: {
  to: string[];
  subject: string;
  body: string;
  inReplyTo?: string;
}): string {
  const lines = [
    `To: ${input.to.join(", ")}`,
    `Subject: ${input.subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
  ];
  if (input.inReplyTo) {
    lines.push(`In-Reply-To: ${input.inReplyTo}`);
    lines.push(`References: ${input.inReplyTo}`);
  }
  lines.push("", input.body);
  return encodeBase64Url(lines.join("\r\n"));
}
