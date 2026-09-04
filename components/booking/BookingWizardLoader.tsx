"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { booking } from "./strings";

/** Skelet dok stiže chunk wizard-a — isti raspored, da ništa ne poskoči. */
export function WizardSkeleton() {
  return (
    <div data-reveal="off" aria-busy="true" className="animate-pulse">
      <p className="sr-only">{booking.section.loading}</p>
      <div className="flex items-center justify-between gap-3">
        <div className="h-7 w-44 rounded-full bg-fg/[0.06]" />
        <div className="h-4 w-20 rounded-full bg-fg/[0.06]" />
      </div>
      <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-10">
        <div>
          <div className="h-9 w-56 max-w-full rounded-lg bg-fg/[0.08]" />
          <div className="mt-3 h-4 w-80 max-w-full rounded-full bg-fg/[0.06]" />
          <div className="mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl border border-line bg-bg/40" />
            ))}
          </div>
        </div>
        <div className="hidden lg:block">
          <div className="h-64 rounded-[24px] border border-line bg-bg/40" />
        </div>
      </div>
    </div>
  );
}

/**
 * Wizard (Convex klijent, motion) ide u zaseban JS chunk koji se NE učitava sa
 * početnom stranom: chunk kreće tek kad se sekcija približi viewportu (600 px).
 * `next/dynamic` sa `ssr: true` bi chunk stavio u početni skup skripti, pa je ovde
 * `ssr: false` — SEO ne trpi (naslov i tekst sekcije su server komponenta), a
 * Lighthouse na telefonu ne plaća wizard koji gost još ne vidi.
 */
const BookingWizard = dynamic(() => import("./BookingWizard"), {
  ssr: false,
  loading: () => <WizardSkeleton />,
});

export function BookingWizardLoader() {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      const id = window.requestAnimationFrame(() => setNear(true));
      return () => window.cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <div ref={ref}>{near ? <BookingWizard /> : <WizardSkeleton />}</div>;
}
