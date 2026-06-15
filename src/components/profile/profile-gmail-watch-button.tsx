"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";

export function ProfileGmailWatchButton() {
  const [message, setMessage] = useState<string | null>(null);
  const refreshWatch = api.gmail.refreshWatch.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        const expires = data.expiration
          ? new Date(Number(data.expiration)).toLocaleString()
          : "unknown";
        setMessage(`Gmail watch renewed (expires ${expires})`);
        toast.success("Gmail watch refreshed", {
          description: `Push notifications active until ${expires}`,
        });
      } else {
        setMessage(data.message);
        toast.error("Could not refresh Gmail watch", {
          description: data.message,
        });
      }
    },
    onError: (err) => {
      setMessage(err.message);
      toast.error("Gmail watch refresh failed", { description: err.message });
    },
  });

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="xs"
        disabled={refreshWatch.isPending}
        onClick={() => refreshWatch.mutate()}
      >
        {refreshWatch.isPending ? "Refreshing…" : "Refresh watch"}
      </Button>
      {message ? (
        <p className="max-w-[12rem] text-right text-[10px] text-muted-foreground">
          {message}
        </p>
      ) : null}
    </div>
  );
}
