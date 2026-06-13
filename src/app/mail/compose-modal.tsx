"use client";

import { useEffect, useState } from "react";

import { api } from "@/trpc/react";

export type ComposeInitial = {
  to?: string;
  subject?: string;
  threadId?: string;
};

type ComposeModalProps = {
  initial: ComposeInitial | null;
  onClose: () => void;
  onSent: () => void;
};

function parseRecipients(raw: string): string[] {
  return raw
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ComposeModal({ initial, onClose, onSent }: ComposeModalProps) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setTo(initial.to ?? "");
      setSubject(initial.subject ?? "");
      setBody("");
      setError(null);
    }
  }, [initial]);

  const sendEmail = api.gmail.sendEmail.useMutation({
    onSuccess: () => onSent(),
    onError: (e) => setError(e.message),
  });
  const createDraft = api.gmail.createDraft.useMutation({
    onSuccess: () => onSent(),
    onError: (e) => setError(e.message),
  });

  if (!initial) return null;

  const recipients = parseRecipients(to);
  const invalid = recipients.filter((r) => !EMAIL_RE.test(r));
  const pending = sendEmail.isPending || createDraft.isPending;

  const validate = () => {
    if (recipients.length === 0) {
      setError("Add at least one recipient.");
      return false;
    }
    if (invalid.length > 0) {
      setError(`Invalid email: ${invalid.join(", ")}`);
      return false;
    }
    setError(null);
    return true;
  };

  const handleSend = () => {
    if (!validate()) return;
    sendEmail.mutate({
      to: recipients,
      subject,
      body,
      threadId: initial.threadId,
    });
  };

  const handleDraft = () => {
    if (!validate()) return;
    createDraft.mutate({
      to: recipients,
      subject,
      body,
      threadId: initial.threadId,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close compose"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
          <h2 className="text-sm font-semibold text-zinc-200">
            {initial.threadId ? "Reply" : "New message"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-px bg-zinc-800">
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="To (comma separated)"
            className="bg-zinc-900 px-5 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
          />
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="bg-zinc-900 px-5 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message…"
            rows={10}
            className="resize-none bg-zinc-900 px-5 py-3 text-sm leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-600"
          />
        </div>

        {error && (
          <p className="border-t border-red-900/50 bg-red-950/40 px-5 py-2 text-xs text-red-400">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between border-t border-zinc-800 px-5 py-3">
          <button
            onClick={handleDraft}
            disabled={pending}
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {createDraft.isPending ? "Saving…" : "Save draft"}
          </button>
          <button
            onClick={handleSend}
            disabled={pending}
            className="rounded-full bg-linear-to-r from-indigo-500 to-violet-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-violet-400 disabled:opacity-50"
          >
            {sendEmail.isPending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
