"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiBrain01Icon,
  Delete02Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

export function ProfileAgentAccessPanel() {
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: access } = api.agent.getAccess.useQuery();
  const { data: allowlist, refetch } = api.agent.listAllowlist.useQuery(
    undefined,
    { enabled: access?.isAdmin ?? false },
  );

  const grantMutation = api.agent.grantAccess.useMutation({
    onSuccess: () => {
      setEmail("");
      setFormError(null);
      void refetch();
    },
    onError: (err) => {
      setFormError(err.message);
    },
  });

  const revokeMutation = api.agent.revokeAccess.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  if (!access?.isAdmin) return null;

  const onGrant = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setFormError("Enter an email address");
      return;
    }
    grantMutation.mutate({ email: trimmed });
  };

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-2">
        <HugeiconsIcon
          icon={AiBrain01Icon}
          strokeWidth={2}
          className="size-5 text-primary"
        />
        <h2 className="text-lg font-semibold text-foreground">
          Agent access
        </h2>
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-[1rem] border border-white/8",
          "bg-[linear-gradient(145deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]",
          "p-6",
        )}
      >
        <p className="mb-5 text-sm text-muted-foreground">
          Mail and Calendar are open to all signed-in users. Grant agent access
          by email for judges and invited testers.
        </p>

        <form onSubmit={onGrant} className="flex flex-col gap-3 sm:flex-row">
          <Input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFormError(null);
            }}
            placeholder="judge@example.com"
            className="h-10 flex-1 rounded-[0.65rem] border-white/10 bg-background/60"
            disabled={grantMutation.isPending}
          />
          <Button
            type="submit"
            className="shrink-0 gap-2 rounded-[0.65rem]"
            disabled={grantMutation.isPending}
          >
            <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} className="size-4" />
            Grant access
          </Button>
        </form>

        {formError ? (
          <p className="mt-2 text-sm text-destructive">{formError}</p>
        ) : null}

        <div className="mt-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Allowed users ({allowlist?.length ?? 0})
          </p>

          {!allowlist?.length ? (
            <p className="text-sm text-muted-foreground">
              No one has been granted agent access yet.
            </p>
          ) : (
            <ul className="divide-y divide-white/8 rounded-[0.75rem] border border-white/8">
              {allowlist.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {entry.email}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {entry.userName ? `${entry.userName} · ` : null}
                      Added{" "}
                      {formatDistanceToNow(new Date(entry.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={revokeMutation.isPending}
                    onClick={() => revokeMutation.mutate({ email: entry.email })}
                    aria-label={`Revoke access for ${entry.email}`}
                  >
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
