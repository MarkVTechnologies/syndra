"use client";

import { useScroll, useTransform, useReducedMotion, type MotionValue } from "motion/react";
import type { RefObject } from "react";

/**
 * Shared scroll-parallax primitive, extracted from the pattern
 * `components/marketing/hero.tsx` originated (background layer drifts
 * slower than foreground content as the section scrolls past).
 *
 * `prefers-reduced-motion` is NOT covered by the global CSS blanket rule
 * in globals.css — that only collapses CSS transitions/animations, not
 * scroll-linked `motion` values driven from JS. So this hook explicitly
 * checks `useReducedMotion()` and, when true, maps the same input range to
 * a fixed "0%" output — an identity transform — rather than branching
 * which hook runs (keeps hook-call order stable across renders).
 */
export function useParallaxScroll(target: RefObject<HTMLElement | null>) {
  return useScroll({ target, offset: ["start start", "end start"] });
}

export function useParallaxTransform(
  scrollYProgress: MotionValue<number>,
  distance: `${number}%`
): MotionValue<string> {
  const reduceMotion = useReducedMotion();
  return useTransform(scrollYProgress, [0, 1], reduceMotion ? ["0%", "0%"] : ["0%", distance]);
}

export function useParallaxFade(scrollYProgress: MotionValue<number>): MotionValue<number> {
  const reduceMotion = useReducedMotion();
  return useTransform(scrollYProgress, [0, 0.9], reduceMotion ? [1, 1] : [1, 0]);
}
