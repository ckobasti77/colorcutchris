"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { booking } from "./strings";
import { eyebrowClass, wizardEase } from "./wizardStyles";

export type SummaryData = {
  service: string | null;
  /** Samo kad uslugu radi više frizera — danas null. */
  staff: string | null;
  date: string | null;
  time: string | null;
  duration: string | null;
  price: string | null;
};

const PLACEHOLDER = "—";

/** Jedan red rezimea; vrednost se menja blur-fade-om (popLayout: stara nestaje iznad nove). */
function Row({ label, value }: { label: string; value: string }) {
  const reduce = useReducedMotion() ?? false;
  return (
    <div className="relative flex items-baseline justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-xs uppercase tracking-[0.12em] text-fg-muted">{label}</dt>
      <AnimatePresence mode="popLayout">
        <motion.dd
          key={value}
          className="text-right text-[15px] tabular-nums text-fg"
          initial={reduce ? false : { opacity: 0, filter: "blur(6px)", y: 4 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.3, ease: wizardEase }}
        >
          {value}
        </motion.dd>
      </AnimatePresence>
    </div>
  );
}

/** „Tvoj termin" — desna kolona na desktopu. */
export function SummaryCard({ data, children }: { data: SummaryData; children?: ReactNode }) {
  return (
    <aside aria-label={booking.summary.title} className="rounded-[24px] border border-line bg-bg/60 p-5">
      <p className={eyebrowClass}>{booking.summary.title}</p>
      {data.service ? (
        <>
          <p className="text-display mt-3 text-2xl text-fg">{data.service}</p>
          <dl className="mt-4 divide-y divide-line border-t border-line">
            {data.staff ? <Row label={booking.summary.staff} value={data.staff} /> : null}
            <Row label={booking.summary.date} value={data.date ?? PLACEHOLDER} />
            <Row label={booking.summary.time} value={data.time ?? PLACEHOLDER} />
            {data.duration ? <Row label={booking.summary.duration} value={data.duration} /> : null}
            {data.price ? <Row label={booking.summary.price} value={data.price} /> : null}
          </dl>
          {data.price ? <p className="mt-2 text-xs leading-relaxed text-fg-muted">{booking.summary.priceNote}</p> : null}
        </>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-fg-muted">{booking.summary.empty}</p>
      )}
      {children ? <div className="mt-5 flex flex-col-reverse gap-2">{children}</div> : null}
    </aside>
  );
}

/**
 * Mobilna lepljiva traka na dnu kartice. Mora da bude direktno dete visokog
 * root-a wizard-a: sticky element putuje samo unutar roditeljske kutije.
 */
export function SummaryBar({ data, children }: { data: SummaryData; children?: ReactNode }) {
  const line = [data.service, data.date, data.time].filter(Boolean).join(" · ");
  return (
    <div className="sticky bottom-0 z-10 -mx-5 -mb-5 mt-6 border-t border-line bg-bg-elev/95 px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur sm:-mx-8 sm:-mb-8 sm:px-8 lg:hidden">
      <p className="mb-2 truncate text-[13px] tabular-nums text-fg-muted" aria-live="polite">
        {line || booking.summary.empty}
      </p>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}
