import { Building2, MapPin, Percent, CalendarClock } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { ScrollReveal, Stagger, StaggerItem } from "./scroll-reveal";

const samples = [
  { name: "Lekki Waterview Residences", city: "Lagos", roi: "24%", tenor: "18 months" },
  { name: "Abuja Central Business Suites", city: "Abuja", roi: "19%", tenor: "24 months" },
  { name: "Port Harcourt Heights", city: "Port Harcourt", roi: "21%", tenor: "12 months" },
];

export function OpportunityPreview() {
  return (
    <section className="bg-background py-20">
      <Container>
        <ScrollReveal>
          <h2 className="font-display text-[clamp(1.5rem,2.5vw+1rem,2rem)] font-bold tracking-[-0.01em] text-foreground">
            Opportunities at launch
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            A preview of the deal flow ambassadors will have to promote from day one.
          </p>
        </ScrollReveal>
        <Stagger className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {samples.map((s) => (
            <StaggerItem key={s.name}>
              <div className="glass-panel-dark sweep sweep-dark group relative h-full overflow-hidden rounded-2xl transition-transform duration-300 ease-out hover:-translate-y-1">
                <div className="relative h-32 overflow-hidden bg-gradient-to-br from-[var(--estate-rust-700)] via-[var(--estate-amber-600)] to-[var(--estate-amber-500)]">
                  <div className="texture-grain absolute inset-0 opacity-30" />
                  <Building2
                    className="absolute -bottom-4 -right-4 size-24 text-[var(--estate-cream-50)]/15 transition-transform duration-500 group-hover:scale-110"
                    strokeWidth={1}
                  />
                  <div className="absolute left-4 top-4">
                    <Badge variant="brass" className="backdrop-blur-sm">
                      Available at launch
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-foreground blur-[3px] select-none">
                    {s.name}
                  </h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3.5" strokeWidth={1.75} />
                    {s.city}
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs">
                    <span className="flex items-center gap-1 font-semibold text-[var(--estate-rust-700)]">
                      <Percent className="size-3.5" strokeWidth={2} />
                      ROI {s.roi}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <CalendarClock className="size-3.5" strokeWidth={1.75} />
                      {s.tenor}
                    </span>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
