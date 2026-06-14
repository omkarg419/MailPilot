import { redirect } from "next/navigation";

import { MailClientLoader } from "@/app/mail/mail-client-loader";
import { auth } from "@/server/auth";

export default async function MailPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  return (
    <MailClientLoader
      userEmail={session.user.email ?? ""}
      userName={session.user.name ?? ""}
      userImage={session.user.image ?? ""}
    />
  );
}
