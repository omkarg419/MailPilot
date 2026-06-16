"use client";

import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import { initials } from "./mail-utils";
import { UserAccountMenu } from "./user-account-menu";

type SidebarUserFooterProps = {
  userEmail: string;
  userName: string;
  userImage: string;
};

export function SidebarUserFooter({
  userEmail,
  userName,
  userImage,
}: SidebarUserFooterProps) {
  return (
    <div
      className={cn(
        "rounded-[0.75rem] border border-sidebar-primary/25 bg-white/[0.02] p-2.5",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]",
      )}
    >
      <div className="flex items-center gap-2">
        <Link
          href="/profile"
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2.5 rounded-[0.5rem] p-1",
            "transition-colors hover:bg-white/[0.04]",
          )}
        >
          <Avatar className="size-9 shrink-0">
            {userImage ? (
              <AvatarImage src={userImage} alt={userName} />
            ) : null}
            <AvatarFallback className="text-xs font-semibold">
              {initials(userName, userEmail)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">
              {userName || "Signed in"}
            </p>
            <p className="truncate text-xs text-sidebar-primary">{userEmail}</p>
          </div>
        </Link>
        <UserAccountMenu />
      </div>
    </div>
  );
}
