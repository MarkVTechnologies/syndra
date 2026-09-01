"use client";

import { useState, useMemo } from "react";
import { Wallet, Coins } from "lucide-react";
import { Container } from "@/components/layout/container";
import { CountUp } from "@/components/ui/count-up";
import { ScrollReveal } from "./scroll-reveal";
import { toMinor, bpsOf } from "@san/core/money";

const MIN = 1_000_000; // N1,000,000
const MAX = 100_000_000; // N100,000,000
const COMMISSION_BPS = 500; // 5%, default per §6.2 settings.defaultCommissionBps

export function CommissionSlider() {
  const [volume, setVolume] = useState(20_000_000);

  const commission = useMemo(() => {
    const minor = toMinor(volume);
    return bpsOf(minor, COMMISSION_BPS);
  }, [volume]);

  const pct = ((volume - MIN) / (MAX - MIN)) * 100;

  return (
    <section className="relative overflow-hidden bg-[var(--estate-espresso-950)] py-20 text-[var(--estate-cream-50)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(560px circle at 10% 100%, rgba(192,88,0,0.22), transparent 60%), radial-gradient(500px circle at 95% 0%, rgba(113,54,0,0.28), transparent 60%)",
        }}
      />
      <div aria-hidden className="texture-ledger-dark pointer-events-none absolute inset-0 opacity-60" />

      <Container className="relative">
        <ScrollReveal>
          <h2 className="font-display text-[clamp(1.5rem,2.5vw+1rem,2rem)] font-bold tracking-[-0.01em]">
            See what you could earn
          </h2>
          <p className="mt-2 max-w-xl text-sm text-[var(--estate-sand-300)]">
            Drag to set investment volume from your network and watch projected
            commission update in real time.
          </p>
        </ScrollReveal>

        <div className="glass-panel-dark mt-10 rounded-2xl p-6 md:p-10">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-center">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--estate-sand-300)]">
                <Wallet className="size-3.5" strokeWidth={1.75} />
                Investment volume referred
              </p>
              <p className="mt-2 font-display text-3xl font-bold tabular-nums">
                {new Intl.NumberFormat("en-NG", {
                  style: "currency",
                  currency: "NGN",
                  maximumFractionDigits: 0,
                }).format(volume)}
              </p>
              <input
                type="range"
                min={MIN}
                max={MAX}
                step={500_000}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="mt-5 h-2 w-full appearance-none rounded-full bg-[rgba(253,251,212,0.1)] accent-[var(--estate-amber-500)]"
                style={{
                  background: `linear-gradient(to right, var(--estate-amber-500) ${pct}%, rgba(253,251,212,0.1) ${pct}%)`,
                }}
                aria-label="Investment volume"
              />
              <div className="mt-2 flex justify-between text-xs text-[var(--estate-sand-300)]/70">
                <span>N1M</span>
                <span>N100M</span>
              </div>
            </div>

            <div className="sweep sweep-dark relative overflow-hidden rounded-xl border border-[var(--estate-amber-500)]/30 bg-[var(--estate-amber-500)]/[0.08] p-6 text-center">
              <p className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--estate-amber-300)]">
                <Coins className="size-3.5" strokeWidth={1.75} />
                Projected commission (5%)
              </p>
              <p className="mt-2 font-display text-4xl font-black tabular-nums text-money">
                <CountUp value={commission} format="money" />
              </p>
              <p className="mt-2 text-xs text-[var(--estate-sand-300)]/70">
                Illustrative. Actual rate varies per opportunity.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
