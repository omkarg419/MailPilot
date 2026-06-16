"use client";

import { useEffect } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  Delete02Icon,
  InboxIcon,
  MailEditIcon,
  MailSendIcon,
  PencilEdit01Icon,
  SpamIcon,
  StarsIcon,
} from "@hugeicons/core-free-icons";

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
import { cn } from "@/lib/utils";

import { MailPilotLogo } from "./mail-pilot-logo";
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

const navButtonClass =
  "h-9 rounded-[0.5rem] px-3 text-sm font-medium text-sidebar-foreground/90 hover:bg-white/[0.06] hover:text-sidebar-foreground data-active:bg-white/[0.08] data-active:text-sidebar-foreground data-active:shadow-none";

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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        onCompose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCompose]);

  return (
    <Sidebar
      collapsible="none"
      className="border-r border-white/[0.06] bg-sidebar"
    >
      <SidebarHeader className="gap-5 px-4 pb-2 pt-5">
        <div className="flex items-center gap-2.5 px-1">
          <MailPilotLogo />
          <span className="text-[1.35rem] font-bold tracking-tight text-sidebar-foreground">
            MailPilot
          </span>
        </div>

        <button
          type="button"
          onClick={onCompose}
          className={cn(
            "flex h-11 w-full items-center gap-3 rounded-[0.75rem] px-3",
            "bg-white/[0.06] text-sm font-medium text-sidebar-foreground",
            "transition-all hover:bg-white/[0.09] active:scale-[0.99]",
          )}
        >
          <HugeiconsIcon
            icon={PencilEdit01Icon}
            strokeWidth={2}
            className="size-4 shrink-0 text-sidebar-primary"
          />
          <span className="flex-1 text-left">Compose</span>
          <kbd className="rounded-[0.4rem] border border-white/10 bg-black/25 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
            ⌘ K
          </kbd>
        </button>
      </SidebarHeader>

      <SidebarContent className="gap-6 px-3">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="h-auto px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/55">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <SidebarMenuItem>
                {leaveMailWorkspace ? (
                  <SidebarMenuButton
                    render={<Link href="/mail" />}
                    className={navButtonClass}
                  >
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
                    className={navButtonClass}
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
                  className={navButtonClass}
                >
                  <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} />
                  Calendar
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isAgent}
                  render={isAgent ? undefined : <Link href="/agent" />}
                  className={navButtonClass}
                >
                  <HugeiconsIcon icon={StarsIcon} strokeWidth={2} />
                  Agent
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="h-auto px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/55">
            Mail
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {MAIL_NAV.map(({ id, icon }) => (
                <SidebarMenuItem key={id}>
                  {leaveMailWorkspace ? (
                    <SidebarMenuButton
                      render={<Link href="/mail" />}
                      className={navButtonClass}
                    >
                      <HugeiconsIcon icon={icon} strokeWidth={2} />
                      {LABEL_NAMES[id]}
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton
                      isActive={activeLabel === id}
                      onClick={() => onLabelChange(id)}
                      className={navButtonClass}
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

      <SidebarFooter className="p-4 pt-2">
        <SidebarUserFooter
          userEmail={userEmail}
          userName={userName}
          userImage={userImage}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
