"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/ui/count-up";
import { ArrowRight, ShieldCheck, TrendingUp } from "lucide-react";
import { LineArt } from "@/components/decor/line-art";
import {
  useParallaxScroll,
  useParallaxTransform,
  useParallaxFade,
} from "@/components/motion/parallax-layer";

export function Hero({ registeredCount }: { registeredCount: number }) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useParallaxScroll(sectionRef);
  // Background mesh + texture drift slower than content — classic parallax.
  const meshY = useParallaxTransform(scrollYProgress, "35%");
  const contentY = useParallaxTransform(scrollYProgress, "12%");
  const fade = useParallaxFade(scrollYProgress);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[var(--estate-espresso-950)] text-[var(--estate-cream-50)]"
    >
      {/* Parallax mesh + glow layer */}
      <motion.div
        aria-hidden
        style={{ y: meshY }}
        className="pointer-events-none absolute inset-0 opacity-90"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(640px circle at 15% 15%, rgba(192,88,0,0.32), transparent 60%), radial-gradient(560px circle at 85% 65%, rgba(113,54,0,0.35), transparent 60%), radial-gradient(420px circle at 55% 100%, rgba(221,108,16,0.18), transparent 65%)",
          }}
        />
      </motion.div>

      {/* Abstract skyline line-art, nodding to the real-estate subject matter */}
      <LineArt variant="skyline" className="text-[var(--estate-amber-300)]" />

      {/* Ledger-grid texture — nods to "every naira accounted for" */}
      <div
        aria-hidden
        className="texture-ledger-dark pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_70%)]"
      />
      {/* Fine film-grain overlay for tactile, premium finish */}
      <div aria-hidden className="texture-grain pointer-events-none absolute inset-0 opacity-40" />

      <motion.div
        style={{ y: contentY }}
        className="relative mx-auto flex max-w-[1200px] flex-col items-start px-5 pb-20 pt-24 md:px-8 md:pb-28 md:pt-32"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="glass-panel-dark sweep sweep-dark inline-flex items-center gap-2 overflow-hidden rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--estate-amber-300)]"
        >
          <ShieldCheck className="size-3.5" strokeWidth={2.25} />
          Vetted real-estate syndication
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 max-w-3xl font-display text-[clamp(2.5rem,5vw+1rem,4rem)] font-black leading-[1.05] tracking-[-0.02em]"
        >
          Earn recurring commission distributing vetted{" "}
          <span className="bg-gradient-to-r from-[var(--estate-amber-500)] to-[var(--estate-amber-300)] bg-clip-text text-transparent">
            real-estate syndication deals
          </span>
          .
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 max-w-xl text-lg text-[var(--estate-sand-300)]"
        >
          Syndran gives every ambassador a personal deal page, automatic attribution, and
          a transparent commission ledger — built for the phone in your hand.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center"
        >
          <Button
            asChild
            size="lg"
            className="sweep relative w-full overflow-hidden shadow-[0_8px_28px_-6px_rgba(192,88,0,0.65)] sm:w-auto"
          >
            <Link href="/signup">
              Become an Ambassador
              <ArrowRight />
            </Link>
          </Button>
          <div className="glass-panel-dark flex items-center gap-2.5 rounded-full px-4 py-2 text-sm text-[var(--estate-sand-300)]">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--estate-amber-500)] opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-[var(--estate-amber-500)]" />
            </span>
            <CountUp value={registeredCount} className="font-semibold text-[var(--estate-cream-50)]" /> ambassadors
            already registered
          </div>
        </motion.div>

        {/* Trust strip — reinforces "investment platform," not a growth-hack landing page.
            Opacity is scroll-driven only (fades as the hero scrolls past) rather than
            mixed with an entrance animation, since animating the same property two
            ways at once (mount tween + scroll-linked motion value) fights itself. */}
        <motion.div
          style={{ opacity: fade }}
          className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-[rgba(253,251,212,0.1)] pt-6 text-xs text-[var(--estate-sand-300)]"
        >
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-[var(--estate-amber-300)]" strokeWidth={2} />
            Admin-vetted opportunities only
          </span>
          <span className="flex items-center gap-1.5">
            <TrendingUp className="size-3.5 text-[var(--estate-amber-300)]" strokeWidth={2} />
            Transparent, auditable commission ledger
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}
