export type MailboxLabel = "INBOX" | "SENT" | "DRAFT" | "SPAM" | "TRASH";

export const LABEL_NAMES: Record<MailboxLabel, string> = {
  INBOX: "Inbox",
  SENT: "Sent",
  DRAFT: "Drafts",
  SPAM: "Spam",
  TRASH: "Trash",
};

export type { ThreadDetail, ThreadSummary } from "@/server/api/routers/gmail";
