"use client";

import { useEffect, useState } from "react";

export function useTypewriter(
  phrases: readonly string[],
  {
    typingMs = 55,
    pauseMs = 2200,
    deleteMs = 32,
  }: { typingMs?: number; pauseMs?: number; deleteMs?: number } = {},
) {
  const [text, setText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const phrase = phrases[phraseIndex] ?? "";
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && text === phrase) {
      timeout = setTimeout(() => setIsDeleting(true), pauseMs);
    } else if (isDeleting && text === "") {
      setIsDeleting(false);
      setPhraseIndex((i) => (i + 1) % phrases.length);
    } else {
      const next = isDeleting
        ? phrase.slice(0, text.length - 1)
        : phrase.slice(0, text.length + 1);
      timeout = setTimeout(
        () => setText(next),
        isDeleting ? deleteMs : typingMs,
      );
    }

    return () => clearTimeout(timeout);
  }, [text, isDeleting, phraseIndex, phrases, typingMs, pauseMs, deleteMs]);

  return text;
}
