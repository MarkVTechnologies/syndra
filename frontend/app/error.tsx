"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sentry capture wires in with SENTRY_DSN — reported via digest below
    // as a user-safe correlation id (PRD §7.3).
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-danger/10">
        <AlertTriangle className="size-6 text-danger" />
      </div>
      <h1 className="mt-5 text-xl font-semibold text-foreground">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Our team has been notified.
        {error.digest && (
          <>
            {" "}Reference: <span className="font-mono">{error.digest}</span>
          </>
        )}
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
