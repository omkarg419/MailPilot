import { redirect } from "next/navigation";

import { LandingPage } from "@/components/landing/landing-page";
import { auth } from "@/server/auth";
import { getConnectionFlags } from "@/server/corsair";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    const { gmail, calendar } = await getConnectionFlags(session.user.id);
    redirect(gmail && calendar ? "/agent" : "/connect");
  }

  return <LandingPage />;
}
