"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link04Icon, MoreVerticalIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ProfileServiceMenuProps = {
  connectHref: string;
};

export function ProfileServiceMenu({ connectHref }: ProfileServiceMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-9 shrink-0 rounded-[0.5rem] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
          />
        }
      >
        <HugeiconsIcon icon={MoreVerticalIcon} strokeWidth={2} />
        <span className="sr-only">Service options</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem render={<Link href={connectHref} />}>
          <HugeiconsIcon icon={Link04Icon} strokeWidth={2} />
          Reconnect service
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
