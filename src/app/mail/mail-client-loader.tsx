"use client";

import dynamic from "next/dynamic";

const MailClient = dynamic(
  () => import("@/app/mail/mail-client").then((mod) => mod.MailClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-svh w-full items-center justify-center bg-background text-muted-foreground">
        Loading mail…
      </div>
    ),
  },
);

type MailClientLoaderProps = {
  userEmail: string;
  userName: string;
  userImage: string;
};

export function MailClientLoader(props: MailClientLoaderProps) {
  return <MailClient {...props} />;
}
