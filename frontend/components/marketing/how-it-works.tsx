import { Link2, Share2, TrendingUp } from "lucide-react";
import { Container } from "@/components/layout/container";
import { ScrollReveal, Stagger, StaggerItem } from "./scroll-reveal";

const steps = [
  {
    icon: Link2,
    title: "Get your personal deal page",
    body: "A branded microsite at syndran.com/yourname, live the moment you sign up.",
  },
  {
    icon: Share2,
    title: "Share it — WhatsApp, Instagram, in person",
    body: "One link. Every channel you already use to reach investors.",
  },
  {
    icon: TrendingUp,
    title: "Earn on every investment your investors make",
    body: "Commission accrues automatically and reconciles to the naira.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-background py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(480px circle at 90% 0%, var(--estate-amber-100), transparent 60%)",
        }}
      />
      <Container className="relative">
        <ScrollReveal>
          <h2 className="font-display text-[clamp(1.5rem,2.5vw+1rem,2rem)] font-bold tracking-[-0.01em] text-foreground">
            How it works
          </h2>
        </ScrollReveal>
        <Stagger className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {steps.map((step, i) => (
            <StaggerItem key={step.title}>
              <div className="glass-panel-dark sweep sweep-dark group relative h-full overflow-hidden rounded-2xl p-6 transition-transform duration-300 ease-out hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-full bg-[var(--estate-amber-100)] text-[var(--estate-rust-700)] shadow-[inset_0_0_0_1px_rgba(113,54,0,0.12)]">
                    <step.icon className="size-5" strokeWidth={1.75} />
                  </div>
                  <span className="font-display text-3xl font-black text-foreground/10 transition-colors group-hover:text-[var(--estate-amber-300)]/40">
                    0{i + 1}
                  </span>
                </div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--estate-rust-700)]">
                  Step {i + 1}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
