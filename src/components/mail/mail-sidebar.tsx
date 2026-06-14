"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiUserIcon,
  Calendar03Icon,
  Delete02Icon,
  InboxIcon,
  MailEditIcon,
  MailSendIcon,
  PencilEdit01Icon,
  SpamIcon,
} from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { initials } from "./mail-utils";
import { UserAccountMenu } from "./user-account-menu";
import { LABEL_NAMES, type MailboxLabel } from "./types";

const MAIL_NAV: {
  id: Exclude<MailboxLabel, "INBOX">;
  icon: typeof MailSendIcon;
}[] = [
  { id: "SENT", icon: MailSendIcon },
  { id: "DRAFT", icon: MailEditIcon },
  { id: "SPAM", icon: SpamIcon },
  { id: "TRASH", icon: Delete02Icon },
];

type MailSidebarProps = {
  activeLabel: MailboxLabel;
  onLabelChange: (label: MailboxLabel) => void;
  onCompose: () => void;
  userEmail: string;
  userName: string;
  userImage: string;
};

export function MailSidebar({
  activeLabel,
  onLabelChange,
  onCompose,
  userEmail,
  userName,
  userImage,
}: MailSidebarProps) {
  return (
    <Sidebar collapsible="none" className="border-r border-sidebar-border">
      <SidebarHeader className="gap-4 p-4">
        <div className="px-2">
          <span className="text-xl font-extrabold tracking-tight text-sidebar-foreground">
            MailPilot
          </span>
        </div>
        <Button
          type="button"
          variant="default"
          className="w-full justify-center"
          onClick={onCompose}
        >
          <HugeiconsIcon icon={PencilEdit01Icon} strokeWidth={2} />
          Compose
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeLabel === "INBOX"}
                  onClick={() => onLabelChange("INBOX")}
                >
                  <HugeiconsIcon icon={InboxIcon} strokeWidth={2} />
                  Inbox
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/calendar" />}>
                  <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} />
                  Calendar
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/agent" />}>
                  <HugeiconsIcon icon={AiUserIcon} strokeWidth={2} />
                  Agent
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Mail</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MAIL_NAV.map(({ id, icon }) => (
                <SidebarMenuItem key={id}>
                  <SidebarMenuButton
                    isActive={activeLabel === id}
                    onClick={() => onLabelChange(id)}
                  >
                    <HugeiconsIcon icon={icon} strokeWidth={2} />
                    {LABEL_NAMES[id]}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-2 px-2">
          <Avatar size="sm">
            {userImage ? (
              <AvatarImage src={userImage} alt={userName} />
            ) : null}
            <AvatarFallback className="text-xs font-semibold">
              {initials(userName, userEmail)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-sidebar-foreground">
              {userName || "Signed in"}
            </p>
            <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
          </div>
          <UserAccountMenu />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
