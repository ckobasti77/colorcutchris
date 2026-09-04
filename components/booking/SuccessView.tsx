"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { MessageCircle, Phone } from "lucide-react";
import { staffMembers, staffName, type StaffKey } from "@/lib/booking";
import { formatDayLong } from "@/lib/dates";
import { fmt, fmtRange } from "@/lib/slots";
import { site } from "@/lib/site";
import { restoreWords, revealWords } from "@/lib/textReveal";
import { booking } from "./strings";
import { eyebrowClass, secondaryButtonClass, wizardEase } from "./wizardStyles";

export type SuccessData = {
  staffKey: StaffKey;
  startMin: number;
  endMin: number;
  date: string;
  serviceTitle: string;
  name: string;
};

/**
 * „Zahtev je poslat." Wizard je van site-wide reveal-a (data-reveal="off"), pa naslov
 * i tekst sami stižu reč po reč: inline opacity 0 → revealWords u efektu → restoreWords.
 */
export function SuccessView({ data, holdHours, onReset }: { data: SuccessData; holdHours: number; onReset: () => void }) {
  const reduce = useReducedMotion() ?? false;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const heading = headingRef.current;
    const text = textRef.current;
    if (!heading || !text) return;
    const tl1 = revealWords(heading, reduce ? { instant: true } : { delay: 0.45 });
    const tl2 = revealWords(text, reduce ? { instant: true } : { delay: 0.7 });
    // Dugme „Pošalji" je nestalo ispod prsta/kursora — fokus ide na naslov.
    heading.focus({ preventScroll: true });
    return () => {
      tl1.kill();
      tl2.kill();
      restoreWords(heading);
      restoreWords(text);
    };
  }, [reduce]);

  const message = booking.success.message({
    service: data.serviceTitle,
    date: formatDayLong(data.date),
    time: fmt(data.startMin),
    name: data.name,
  });
  const viberHref = `${site.viber}&text=${encodeURIComponent(message)}`;
  const showStaff = staffMembers.length > 1;

  return (
    <motion.div
      data-reveal="off"
      aria-live="polite"
      initial={reduce ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: reduce ? 0 : 0.4, ease: wizardEase }}
    >
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-neon/15 text-neon" aria-hidden="true">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
          <motion.path
            d="M5 12.5l4 4 10-10"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: reduce ? 0 : 0.5, ease: "easeOut", delay: reduce ? 0 : 0.15 }}
          />
        </svg>
      </span>

      <h3 ref={headingRef} tabIndex={-1} className="text-display mt-5 text-3xl text-fg outline-none" style={{ opacity: 0 }}>
        {booking.success.title}
      </h3>
      <p ref={textRef} className="mt-3 max-w-prose text-base leading-relaxed text-fg-muted" style={{ opacity: 0 }}>
        {booking.success.text(holdHours)}
      </p>

      <div className="mt-6 rounded-2xl border border-line bg-bg/60 px-5 py-4">
        <p className="text-display text-xl text-fg">{data.serviceTitle}</p>
        <p className="mt-1 text-sm tabular-nums text-fg-muted">
          {formatDayLong(data.date)} · {fmtRange(data.startMin, data.endMin)}
          {showStaff ? ` · ${staffName(data.staffKey)}` : null}
        </p>
      </div>

      <p className={`${eyebrowClass} mt-8`}>{booking.success.quickTitle}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        <li>
          <a href={viberHref} className={`${secondaryButtonClass} gap-2`}>
            <MessageCircle size={16} aria-hidden="true" />
            {booking.success.viber}
          </a>
        </li>
        <li>
          <a href={site.phone.href} className={`${secondaryButtonClass} gap-2`}>
            <Phone size={16} aria-hidden="true" />
            {booking.success.call}
            <span className="tabular-nums text-fg-muted">{site.phone.display}</span>
          </a>
        </li>
      </ul>

      <button type="button" onClick={onReset} className={`${secondaryButtonClass} mt-8`}>
        {booking.success.reset}
      </button>
    </motion.div>
  );
}
