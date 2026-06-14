import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";

import { signIn } from "@/server/auth";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function GoogleIcon() {
  return (
    <svg className="size-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

const FEATURES = [
  "Gmail Search",
  "AI Drafts",
  "Calendar Assistant",
] as const;

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: "Could not start Google sign-in. Please try again.",
  OAuthCallback: "Google sign-in failed. Please try again.",
  OAuthAccountNotLinked:
    "This email is linked to another sign-in method. Use the original provider.",
  Default: "Something went wrong during sign-in. Please try again.",
};

type SignInFormProps = {
  redirectTo?: string;
  error?: string;
};

export function SignInForm({ redirectTo, error }: SignInFormProps) {
  const safeRedirect = safeRedirectPath(redirectTo);
  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default)
    : null;

  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: safeRedirect });
  }

  return (
    <Card className="w-full max-w-md border-border/80 bg-card/95 shadow-xl backdrop-blur-sm border rounded-2xl overflow-hidden">
      <CardHeader className="gap-3 pb-2 text-center">
        <CardTitle className="text-3xl font-extrabold tracking-tight">
          MailPilot
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed text-muted-foreground">
          AI-first inbox for Gmail &amp; Calendar
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6 px-6 pb-8">
        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>Sign-in failed</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <form action={signInWithGoogle}>
          <Button
            type="submit"
            variant="default"
            size="lg"
            className={cn(
              "h-11 w-full gap-2.5 rounded-full font-semibold shadow-sm",
              "transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98]",
            )}
          >
            <GoogleIcon />
            Sign in with Google
          </Button>
        </form>

        <Separator className="bg-border/70" />

        <ul className="flex flex-col gap-3">
          {FEATURES.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-3 text-sm text-foreground"
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-3" />
              </span>
              {feature}
            </li>
          ))}
        </ul>
        <Separator className=" my-6 bg-border/70" />
        <CardFooter className="justify-center  border-border/70 p-0">
        <p className="w-full text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Trusted by builders
        </p>
      </CardFooter>
      </CardContent>
      
      
    </Card>
  );
}
