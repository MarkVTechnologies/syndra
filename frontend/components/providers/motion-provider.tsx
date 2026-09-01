"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Single global reduced-motion switch (PRD §10.5 REDUCED MOTION). No
 * individual component needs to remember to check the media query —
 * MotionConfig's reducedMotion="user" collapses all Framer Motion
 * animations to instant transforms/opacity when the OS setting is on.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
