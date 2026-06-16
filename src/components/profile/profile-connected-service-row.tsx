"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";

import { buttonVariants } from "@/components/ui/button";
import { ProfileServiceMenu } from "@/components/profile/profile-service-menu";
import { cn } from "@/lib/utils";

type ProfileConnectedServiceRowProps = {
  icon: IconSvgElement;
  title: string;
  description: string;
  connected: boolean;
  connectHref: string;
  connectedAction?: ReactNode;
};

function ConnectedStatus({ connected }: { connected: boolean }) {
  if (!connected) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
        <span className="size-1.5 rounded-full bg-destructive" />
        Not connected
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">
      <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
      Connected
    </span>
  );
}

export function ProfileConnectedServiceRow({
  icon,
  title,
  description,
  connected,
  connectHref,
  connectedAction,
}: ProfileConnectedServiceRowProps) {
  return (
    <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-1 gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-[0.65rem] border border-white/8 bg-white/[0.04] text-foreground">
          <HugeiconsIcon icon={icon} strokeWidth={2} className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
          <div className="mt-3">
            <ConnectedStatus connected={connected} />
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-start justify-end gap-2 sm:pl-4">
        {connected ? (
          connectedAction
        ) : (
          <Link
            href={connectHref}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-10 rounded-[0.75rem] border-white/12 bg-white/[0.04] px-4 text-sm font-medium",
            )}
          >
            Connect
          </Link>
        )}
        <ProfileServiceMenu connectHref={connectHref} />
      </div>
    </div>
  );
}
