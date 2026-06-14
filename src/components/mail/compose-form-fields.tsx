"use client";

import type { ReactNode, RefObject } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ContactBookIcon,
  NoteIcon,
  Tag01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function ComposeFieldLabel({
  icon,
  label,
  htmlFor,
}: {
  icon: typeof UserIcon;
  label: string;
  htmlFor: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
    >
      <HugeiconsIcon icon={icon} strokeWidth={2} className="size-3.5" />
      {label}
    </label>
  );
}

export type ComposeFormFieldsProps = {
  idPrefix?: string;
  to: string;
  onToChange?: (value: string) => void;
  subject: string;
  onSubjectChange?: (value: string) => void;
  body: string;
  onBodyChange?: (value: string) => void;
  disabled?: boolean;
  readOnlyTo?: boolean;
  readOnlySubject?: boolean;
  compact?: boolean;
  bodyRef?: RefObject<HTMLTextAreaElement | null>;
  bodyExtra?: ReactNode;
  bodyClassName?: string;
};

export function ComposeFormFields({
  idPrefix = "compose",
  to,
  onToChange,
  subject,
  onSubjectChange,
  body,
  onBodyChange,
  disabled = false,
  readOnlyTo = false,
  readOnlySubject = false,
  compact = false,
  bodyRef,
  bodyExtra,
  bodyClassName,
}: ComposeFormFieldsProps) {
  const readOnly = !onToChange && !onSubjectChange && !onBodyChange;

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "flex flex-col gap-2 border-b border-border px-5 py-4",
          compact && "px-4 py-3",
        )}
      >
        <ComposeFieldLabel icon={UserIcon} label="To" htmlFor={`${idPrefix}-to`} />
        <InputGroup>
          <InputGroupInput
            id={`${idPrefix}-to`}
            value={to}
            onChange={(e) => onToChange?.(e.target.value)}
            placeholder="Comma-separated recipients"
            disabled={disabled || readOnlyTo || readOnly}
            readOnly={readOnlyTo || readOnly}
          />
          <InputGroupAddon align="inline-end">
            <HugeiconsIcon icon={ContactBookIcon} strokeWidth={2} />
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div
        className={cn(
          "flex flex-col gap-2 border-b border-border px-5 py-4",
          compact && "px-4 py-3",
        )}
      >
        <ComposeFieldLabel
          icon={Tag01Icon}
          label="Subject"
          htmlFor={`${idPrefix}-subject`}
        />
        <InputGroup>
          <InputGroupInput
            id={`${idPrefix}-subject`}
            value={subject}
            onChange={(e) => onSubjectChange?.(e.target.value)}
            placeholder="Subject"
            disabled={disabled || readOnlySubject || readOnly}
            readOnly={readOnlySubject || readOnly}
          />
        </InputGroup>
      </div>

      <div className={cn("flex flex-col gap-2 px-5 py-4", compact && "px-4 py-3")}>
        <ComposeFieldLabel
          icon={NoteIcon}
          label="Message"
          htmlFor={`${idPrefix}-body`}
        />
        <div className={bodyExtra ? "relative" : undefined}>
          <Textarea
            ref={bodyRef}
            id={`${idPrefix}-body`}
            value={body}
            onChange={(e) => onBodyChange?.(e.target.value)}
            placeholder="Write your message…"
            rows={compact ? 8 : 10}
            disabled={disabled || readOnly}
            readOnly={readOnly}
            className={cn(
              "min-h-40 resize-y bg-input/20 dark:bg-input/30",
              compact && "min-h-32",
              bodyExtra && "pb-10",
              bodyClassName,
            )}
          />
          {bodyExtra}
        </div>
      </div>
    </div>
  );
}
