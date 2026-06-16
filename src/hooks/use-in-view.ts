"use client";

import { useEffect, useRef, useState } from "react";

export function useInView<T extends HTMLElement>(
  options?: IntersectionObserverInit,
) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const threshold = options?.threshold ?? 0.15;
    const rootMargin = options?.rootMargin ?? "0px 0px -8% 0px";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { threshold, rootMargin, root: options?.root ?? null },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [options?.threshold, options?.rootMargin, options?.root]);

  return { ref, inView };
}
