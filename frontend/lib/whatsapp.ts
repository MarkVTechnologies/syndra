/** Pre-filled, contextual wa.me deep link per opportunity. PRD §14 Day 3 Block 4. */
export function buildWhatsAppLink(whatsapp: string, opportunityTitle?: string): string {
  const digits = whatsapp.replace(/\D/g, "");
  const message = opportunityTitle
    ? `Hi! I'm interested in "${opportunityTitle}" on SAN. Can you tell me more?`
    : "Hi! I found your SAN page and I'm interested in investing. Can you tell me more?";
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildTelLink(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
