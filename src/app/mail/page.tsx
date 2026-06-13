import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { MailClient } from "@/app/mail/mail-client";


export default async function MailPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  return (
    <MailClient
      userEmail={session.user.email ?? ""}
      userName={session.user.name ?? ""}
      userImage={session.user.image ?? ""}
    />
  );
}
