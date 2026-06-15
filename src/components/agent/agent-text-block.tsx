"use client";

export function AgentTextBlock({ content }: { content: string }) {
  if (!content.trim()) return null;

  return (
    <div className="text-[15px] leading-relaxed text-foreground ">
      <p className="whitespace-pre-wrap">{content}</p>
    </div>
  );
}
