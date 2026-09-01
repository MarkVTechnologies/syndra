"use client";

import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { useSessionId } from "@/lib/use-session-id";
import { cn } from "@/lib/utils";

export function WhatsAppButton({
  whatsapp,
  ambassadorId,
  opportunityTitle,
  className,
  children,
}: {
  whatsapp: string;
  ambassadorId: string;
  opportunityTitle?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const sessionId = useSessionId();
  const href = buildWhatsAppLink(whatsapp, opportunityTitle);

  const onClick = () => {
    // Fire-and-forget — never blocks the navigation. PRD §7.1 /api/track.
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "whatsapp_click",
        ambassadorId,
        sessionId,
        props: { opportunityTitle: opportunityTitle ?? null },
      }),
      keepalive: true,
    });
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 text-sm font-semibold text-white shadow-[var(--san-e3)] transition-transform active:scale-95",
        className
      )}
    >
      <MessageCircle className="size-5" />
      {children ?? "Message on WhatsApp"}
    </a>
  );
}
