"use client";

import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/use-in-view";

type LandingSectionProps = {
  id?: string;
  className?: string;
  children: React.ReactNode;
  containerClassName?: string;
};

export function LandingSection({
  id,
  className,
  children,
  containerClassName,
}: LandingSectionProps) {
  const { ref, inView } = useInView<HTMLElement>();

  return (
    <section
      id={id}
      ref={ref}
      className={cn(
        "border-b border-border py-24 transition-all duration-700 ease-out",
        inView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto w-full max-w-6xl px-6",
          containerClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
