"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  LOGO_FILL,
  LOGO_VIEWBOX,
  NEON_LINES,
  NEON_STROKE_WIDTH,
  type Polyline,
} from "@/lib/brand/logo-data";

gsap.registerPlugin(useGSAP);

const toPath = (line: Polyline) =>
  "M" + line.map(([x, y]) => `${x} ${y}`).join(" L");

type Props = {
  className?: string;
  /** Kad je true, neon se "pali" potez po potezu. */
  lit?: boolean;
  /** Boja štampanih slova "color cut" / "and more" (u salonu su crna na akrilu). */
  textColor?: string;
};

/**
 * 2D neon verzija loga — SVG stroke koji se iscrtava (dasharray) + glow.
 * Koristi se kao fallback za 3D (mobilni, reduced-motion) i kao mali logo u navigaciji.
 */
export function NeonLogo({ className, lit = true, textColor = "currentColor" }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const { x, y, w, h } = LOGO_VIEWBOX;

  useGSAP(
    () => {
      const svg = ref.current;
      if (!svg) return;
      const tubes = svg.querySelectorAll<SVGPathElement>("[data-tube]");
      const glow = svg.querySelector<SVGGElement>("[data-glow]");

      if (!lit) {
        gsap.set(tubes, { strokeDashoffset: 1, opacity: 0.18 });
        gsap.set(glow, { opacity: 0 });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
      tl.set(tubes, { strokeDashoffset: 1, opacity: 1 })
        .set(glow, { opacity: 0 })
        // iscrtavanje — luk prvo, pa potpis
        .to(tubes, { strokeDashoffset: 0, duration: 1.6, stagger: 0.06 })
        // "kontakt" — kratko treperenje kao pravi neon
        .to(glow, { opacity: 1, duration: 0.05 }, "-=0.3")
        .to(glow, { opacity: 0.2, duration: 0.05 })
        .to(glow, { opacity: 1, duration: 0.06 })
        .to(glow, { opacity: 0.5, duration: 0.04 })
        .to(glow, { opacity: 1, duration: 0.3, ease: "power1.out" });
    },
    { scope: ref, dependencies: [lit] },
  );

  const tubeProps = {
    fill: "none",
    stroke: "var(--neon)",
    strokeWidth: NEON_STROKE_WIDTH * 1.35,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    pathLength: 1,
    strokeDasharray: 1,
  };

  return (
    <svg
      ref={ref}
      viewBox={`${x} ${y} ${w} ${h}`}
      className={className}
      role="img"
      aria-label="color cut Chris and more — neon potpis"
    >
      <defs>
        <filter id="neon-blur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      {/* štampana slova na akrilu */}
      <path d={LOGO_FILL.text} fill={textColor} fillRule="evenodd" opacity={0.9} />

      {/* halo (blur kopija) */}
      <g data-glow filter="url(#neon-blur)" opacity={0}>
        {[...NEON_LINES.arc, ...NEON_LINES.signature].map((line, i) => (
          <path
            key={`g${i}`}
            d={toPath(line)}
            fill="none"
            stroke="var(--neon-glow)"
            strokeWidth={NEON_STROKE_WIDTH * 4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </g>

      {/* tube */}
      {NEON_LINES.arc.map((line, i) => (
        <path key={`a${i}`} data-tube d={toPath(line)} {...tubeProps} />
      ))}
      {NEON_LINES.signature.map((line, i) => (
        <path key={`s${i}`} data-tube d={toPath(line)} {...tubeProps} />
      ))}
    </svg>
  );
}
