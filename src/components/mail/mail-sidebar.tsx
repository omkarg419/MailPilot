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
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { SidebarUserFooter } from "./sidebar-user-footer";
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
  activeWorkspace?: "mail" | "agent" | "calendar";
  activeLabel: MailboxLabel;
  onLabelChange: (label: MailboxLabel) => void;
  onCompose: () => void;
  userEmail: string;
  userName: string;
  userImage: string;
  inboxNewCount?: number;
};

export function MailSidebar({
  activeWorkspace = "mail",
  activeLabel,
  onLabelChange,
  onCompose,
  userEmail,
  userName,
  userImage,
  inboxNewCount = 0,
}: MailSidebarProps) {
  const isAgent = activeWorkspace === "agent";
  const isCalendar = activeWorkspace === "calendar";
  const leaveMailWorkspace = isAgent || isCalendar;

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
          size="icon-sm"
          className="h-9 w-full justify-center gap-2 rounded-full font-semibold shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98]"
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
                {leaveMailWorkspace ? (
                  <SidebarMenuButton render={<Link href="/mail" />}>
                    <HugeiconsIcon icon={InboxIcon} strokeWidth={2} />
                    Inbox
                    {inboxNewCount > 0 ? (
                      <SidebarMenuBadge>{inboxNewCount}</SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton
                    isActive={activeLabel === "INBOX"}
                    onClick={() => onLabelChange("INBOX")}
                  >
                    <HugeiconsIcon icon={InboxIcon} strokeWidth={2} />
                    Inbox
                    {inboxNewCount > 0 && activeLabel !== "INBOX" ? (
                      <SidebarMenuBadge>{inboxNewCount}</SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isCalendar}
                  render={isCalendar ? undefined : <Link href="/calendar" />}
                >
                  <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} />
                  Calendar
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isAgent}
                  render={isAgent ? undefined : <Link href="/agent" />}
                >
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
                  {leaveMailWorkspace ? (
                    <SidebarMenuButton render={<Link href="/mail" />}>
                      <HugeiconsIcon icon={icon} strokeWidth={2} />
                      {LABEL_NAMES[id]}
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton
                      isActive={activeLabel === id}
                      onClick={() => onLabelChange(id)}
                    >
                      <HugeiconsIcon icon={icon} strokeWidth={2} />
                      {LABEL_NAMES[id]}
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarUserFooter
          userEmail={userEmail}
          userName={userName}
          userImage={userImage}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
