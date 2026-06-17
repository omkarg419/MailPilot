import "@/styles/globals.css";

import { type Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "MailPilot",
  description: "AI-native Gmail and Calendar platform",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn(GeistSans.variable, GeistMono.variable, "dark font-mono")}
    >
      <body className="bg-background text-foreground">
        <TRPCReactProvider>{children}</TRPCReactProvider>
        <Toaster theme="dark" position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
