"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Meki ulaz elementa kad uđe u viewport. Za stanja komponenti koristimo motion,
 * za sve vezano za scroll-poziciju GSAP (vidi docs/BRAND.md → podela).
 */
export function Reveal({
  children,
  delay = 0,
  className,
  y = 22,
  as = "div",
  "data-reveal": dataReveal,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
  as?: "div" | "li" | "section" | "article" | "header";
  /** Prosleđuje se elementu — `"off"` vadi karticu iz site-wide reveal-a teksta. */
  "data-reveal"?: "off" | "text";
}) {
  const reduced = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      data-reveal={dataReveal}
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </Tag>
  );
}
