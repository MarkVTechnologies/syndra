import { HelpCircle } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ScrollReveal } from "./scroll-reveal";

const faqs = [
  { q: "How much does it cost to become an ambassador?", a: "Nothing. Joining SAN and getting your microsite is free." },
  { q: "When do I get paid?", a: "Commission accrues when an investment you referred is confirmed, matures after a cooling period, then is marked paid by the admin team." },
  { q: "What are the requirements?", a: "You need a valid phone/WhatsApp number and a genuine interest in real estate. No prior syndication experience required." },
  { q: "Do I need a real estate license?", a: "No license is required to promote opportunities as an ambassador — you are not the one selling securities." },
  { q: "When does SAN launch?", a: "Ambassadors on the waitlist get first access. We'll email you the moment your account goes live." },
  { q: "How are deals vetted?", a: "Every opportunity is reviewed and published by the SAN admin team before it appears in the marketplace." },
  { q: "How does WhatsApp sharing work?", a: "Your microsite link comes with a pre-formatted WhatsApp broadcast message you can send with one tap." },
  { q: "How is my data handled?", a: "Your data is used only to run your ambassador account and is never sold. See our privacy policy for details." },
];

export function FAQ() {
  return (
    <section className="texture-ledger-dark relative bg-surface-muted py-20">
      <Container className="relative max-w-[720px]">
        <ScrollReveal>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-full bg-[var(--estate-amber-100)] text-[var(--estate-rust-700)]">
              <HelpCircle className="size-4" strokeWidth={1.75} />
            </div>
            <h2 className="font-display text-[clamp(1.5rem,2.5vw+1rem,2rem)] font-bold tracking-[-0.01em] text-foreground">
              Frequently asked questions
            </h2>
          </div>
        </ScrollReveal>
        <div className="glass-panel-dark mt-8 rounded-2xl px-6">
          <Accordion type="single" collapsible>
            {faqs.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger>{f.q}</AccordionTrigger>
                <AccordionContent>{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Container>
    </section>
  );
}
