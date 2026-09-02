import { Globe, LayoutGrid, Target, LineChart, MessageCircle, ScrollText } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Stagger, StaggerItem, ScrollReveal } from "./scroll-reveal";

const benefits = [
  { icon: Globe, title: "Personal microsite", body: "syndran.com/yourname — yours, always." },
  { icon: LayoutGrid, title: "Curated deal inventory", body: "Only vetted, admin-published opportunities." },
  { icon: Target, title: "Automatic attribution", body: "Every referral is tracked and provably yours." },
  { icon: LineChart, title: "Real-time earnings dashboard", body: "Views, referrals and commission in one place." },
  { icon: MessageCircle, title: "WhatsApp-native sharing", body: "Pre-filled messages, one tap to send." },
  { icon: ScrollText, title: "Transparent commission ledger", body: "Every naira accounted for, nothing hidden." },
];

export function Benefits() {
  return (
    <section className="texture-ledger-dark relative bg-surface-muted py-20">
      <Container className="relative">
        <ScrollReveal>
          <h2 className="font-display text-[clamp(1.5rem,2.5vw+1rem,2rem)] font-bold tracking-[-0.01em] text-foreground">
            What you get
          </h2>
        </ScrollReveal>
        <Stagger className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <StaggerItem key={b.title}>
              <div className="glass-panel-dark sweep sweep-dark flex h-full gap-4 overflow-hidden rounded-2xl p-5 transition-transform duration-300 ease-out hover:-translate-y-1">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--estate-amber-100)] text-[var(--estate-rust-700)]">
                  <b.icon className="size-5" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{b.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{b.body}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
