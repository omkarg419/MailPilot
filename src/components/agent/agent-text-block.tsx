"use client";

export function AgentTextBlock({ content }: { content: string }) {
  if (!content.trim()) return null;

  return (
    <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-2.5 text-sm text-foreground">
      <p className="whitespace-pre-wrap">{content}</p>
    </div>
  );
}
