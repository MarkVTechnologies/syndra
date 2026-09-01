"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      window.location.reload();
    };
    window.addEventListener("online", goOnline);
    return () => window.removeEventListener("online", goOnline);
  }, []);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--san-obsidian-950)] px-6 text-center text-white">
      <div className="flex size-14 items-center justify-center rounded-full bg-white/5">
        <WifiOff className="size-6 text-slate-400" />
      </div>
      <h1 className="mt-5 font-display text-xl font-bold">You&apos;re offline</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        {online
          ? "Back online — reloading..."
          : "Some pages you've already visited are still available. We'll reconnect automatically."}
      </p>
      <Button
        variant="secondary"
        className="mt-6"
        onClick={() => window.location.reload()}
      >
        Retry
      </Button>
    </div>
  );
}
