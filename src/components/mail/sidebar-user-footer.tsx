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
    <div className="flex items-center gap-1 px-2">
      <Link
        href="/profile"
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 rounded-md p-1 -ml-1",
          "transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        )}
      >
        <Avatar size="sm">
          {userImage ? (
            <AvatarImage src={userImage} alt={userName} />
          ) : null}
          <AvatarFallback className="text-xs font-semibold">
            {initials(userName, userEmail)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-xs font-medium text-sidebar-foreground">
            {userName || "Signed in"}
          </p>
          <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
        </div>
      </Link>
      <UserAccountMenu />
    </div>
  );
}
