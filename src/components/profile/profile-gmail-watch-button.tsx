"use client";

import { useState } from "react";
import { toast } from "sonner";

import { ProfileWatchRefreshButton } from "@/components/profile/profile-watch-refresh-button";
import { api } from "@/trpc/react";

export function ProfileGmailWatchButton() {
  const [message, setMessage] = useState<string | null>(null);
  const refreshWatch = api.gmail.refreshWatch.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        const expires = data.expiration
          ? new Date(Number(data.expiration)).toLocaleString()
          : "unknown";
        setMessage(`Watch renewed (expires ${expires})`);
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
    <ProfileWatchRefreshButton
      isPending={refreshWatch.isPending}
      onClick={() => refreshWatch.mutate()}
      hint="Use if new mail stops updating automatically"
      message={message}
    />
  );
}
