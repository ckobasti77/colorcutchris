"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { manifesto } from "@/lib/site";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Kristijanov tekst o konsultaciji (sa FB/IG karusela), postavljen kao editorijal:
 * reči se "pale" dok skroluješ — kao da ih izgovara u ritmu.
 */
export function Manifesto() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const blocks = el.querySelectorAll<HTMLElement>("[data-words]");
      blocks.forEach((block) => {
        const words = block.querySelectorAll("span");
        if (reduced) {
          gsap.set(words, { opacity: 1 });
          return;
        }
        gsap.fromTo(
          words,
          { opacity: 0.14 },
          {
            opacity: 1,
            stagger: 0.04,
            ease: "none",
            scrollTrigger: {
              trigger: block,
              start: "top 78%",
              end: "bottom 45%",
              scrub: 0.6,
            },
          },
        );
      });
    },
    { scope: root },
  );

  const splitWords = (text: string) =>
    text.split(" ").map((w, i) => (
      <span key={i} className="inline-block will-change-[opacity]">
        {w}&nbsp;
      </span>
    ));

  const [first, ...rest] = manifesto;

  return (
    <section
      ref={root}
      /* drugi reveal na sajtu: scroll-scrubbed reci — van site-wide prolaza */
      data-reveal="off"
      className="relative overflow-hidden px-6 py-32 md:px-10 lg:px-16"
      aria-labelledby="manifest-title"
    >
      {/* meki halo u boji neona iza teksta */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-24 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-neon/[0.06] blur-3xl"
      />

      <div className="relative mx-auto max-w-3xl">
        <p className="mb-8 text-xs font-medium uppercase tracking-[0.22em] text-accent">
          Pre nego što uzmem četkicu
        </p>

        <h2 id="manifest-title" className="text-display text-[clamp(2.25rem,5.4vw,4.5rem)] text-fg">
          <span data-words className="block">
            {splitWords(first.q!)}
          </span>
          <span data-words className="mt-4 block italic text-accent">
            {splitWords(first.a)}
          </span>
        </h2>

        <div className="mt-16 space-y-10 text-[clamp(1.25rem,2.2vw,1.75rem)] leading-[1.35] text-fg">
          {rest.map((p, i) => (
            <p key={i} data-words className={i === rest.length - 1 ? "text-display italic text-[1.15em]" : ""}>
              {splitWords(p.a)}
            </p>
          ))}
        </div>

        <p className="mt-14 text-xs uppercase tracking-[0.2em] text-fg-muted">— Kristijan, sa Instagrama salona</p>
      </div>
    </section>
  );
}
