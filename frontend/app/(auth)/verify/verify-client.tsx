"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyEmailAction } from "@/app/actions/auth";

export function VerifyClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("Missing verification token");
      return;
    }
    verifyEmailAction(token).then((result) => {
      if (result.ok) {
        setState("success");
      } else {
        setState("error");
        setMessage(result.error.message);
      }
    });
  }, [token]);

  if (state === "loading") {
    return (
      <div className="mt-6 flex flex-col items-center gap-3">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Verifying your email...</p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="mt-6 flex flex-col items-center gap-3">
        <CheckCircle2 className="size-10 text-success" />
        <h1 className="text-lg font-semibold text-foreground">Email verified</h1>
        <p className="text-sm text-muted-foreground">Your account is ready.</p>
        <Link href="/login" className="mt-2 w-full">
          <Button className="w-full">Log in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      <XCircle className="size-10 text-danger" />
      <h1 className="text-lg font-semibold text-foreground">Verification failed</h1>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Link href="/login" className="mt-2 w-full">
        <Button variant="secondary" className="w-full">Back to login</Button>
      </Link>
    </div>
  );
}
