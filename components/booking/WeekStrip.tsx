"use client";

import { useId, useRef, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDayLong, formatDayNumber, formatMonthYear, formatWeekdayShort } from "@/lib/dates";

/** „septembar 2026." ili, kad prozor od 7 dana prelazi mesec, „septembar – oktobar 2026." */
function rangeTitle(first: string, last: string): string {
  const a = formatMonthYear(first);
  const b = formatMonthYear(last);
  if (a === b) return a;
  const yearA = a.match(/\d{4}\.$/)?.[0];
  const yearB = b.match(/\d{4}\.$/)?.[0];
  return yearA === yearB ? `${a.replace(/\s\d{4}\.$/, "")} – ${b}` : `${a} – ${b}`;
}
import { addDays } from "@/lib/slots";
import { booking } from "./strings";
import { focusRingClass } from "./wizardStyles";

export type DayInfo = {
  date: string;
  /** Broj slobodnih početaka; undefined dok se nedelja učitava. */
  count: number | undefined;
  /** Da li salon tog dana radi; undefined dok se učitava. */
  open: boolean | undefined;
};

type Props = {
  weekStart: string;
  today: string;
  /** Poslednji dan koji se može zakazati (uključivo). */
  horizonEnd: string;
  selected: string | null;
  days: readonly DayInfo[];
  onSelect: (date: string) => void;
  onPrev: () => void;
  onNext: () => void;
};

const arrowClass = [
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-fg transition-colors duration-200 hover:bg-bg",
  "disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent",
  focusRingClass,
].join(" ");

export function isDayEnabled(d: DayInfo, today: string, horizonEnd: string): boolean {
  return d.date >= today && d.date <= horizonEnd && d.open !== false && d.count !== 0;
}

/** Sedam dana od `weekStart`; jedan radio-grupa sa roving tabindex-om (strelice, Home, End). */
export function WeekStrip({ weekStart, today, horizonEnd, selected, days, onSelect, onPrev, onNext }: Props) {
  const reduce = useReducedMotion() ?? false;
  const labelId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const isCurrentWeek = weekStart === today;
  const canPrev = weekStart > today;
  const canNext = addDays(weekStart, 7) <= horizonEnd;

  const enabled = (d: DayInfo) => isDayEnabled(d, today, horizonEnd);
  const selectedIndex = selected ? days.findIndex((d) => d.date === selected) : -1;
  const firstEnabled = days.findIndex(enabled);
  const rovingIndex = selectedIndex >= 0 ? selectedIndex : firstEnabled >= 0 ? firstEnabled : 0;

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    let i = index;
    if (e.key === "Home") i = -1;
    if (e.key === "End") i = days.length;
    for (let step = 0; step < days.length; step++) {
      i = e.key === "Home" ? i + 1 : e.key === "End" ? i - 1 : i + dir;
      if (i < 0 || i >= days.length) break;
      if (enabled(days[i])) {
        onSelect(days[i].date);
        refs.current[i]?.focus();
        return;
      }
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-bg/60 p-1.5 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button type="button" onClick={onPrev} disabled={!canPrev} aria-label={booking.day.prevWeek} className={arrowClass}>
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <p id={labelId} className="text-display text-center text-2xl text-fg">
          {rangeTitle(weekStart, days[days.length - 1]?.date ?? weekStart)}
          {isCurrentWeek ? (
            <span className="mt-1 block font-sans text-xs leading-normal tracking-normal text-fg-muted sm:mt-0 sm:ml-2 sm:inline">
              ({booking.day.thisWeek})
            </span>
          ) : null}
        </p>
        <button type="button" onClick={onNext} disabled={!canNext} aria-label={booking.day.nextWeek} className={arrowClass}>
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>

      <div role="radiogroup" aria-label={booking.day.weekStrip} aria-describedby={labelId} className="grid grid-cols-7 gap-0 sm:gap-1">
        {days.map((d, i) => {
          const isSel = d.date === selected;
          const isToday = d.date === today;
          const past = d.date < today;
          const beyond = d.date > horizonEnd;
          const closed = d.open === false;
          const isEnabled = enabled(d);
          const loading = d.count === undefined && !past && !beyond;
          const reason = past ? booking.day.past : beyond ? booking.day.beyond : closed ? booking.day.closed : d.count === 0 ? booking.day.noSlots : "";
          const label = `${formatDayLong(d.date)}${isToday ? `, ${booking.day.today}` : ""}${reason ? `, ${reason}` : ""}`;
          return (
            <button
              key={d.date}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isSel}
              aria-label={label}
              aria-disabled={!isEnabled}
              tabIndex={i === rovingIndex ? 0 : -1}
              onClick={() => {
                if (isEnabled) onSelect(d.date);
              }}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={[
                "group flex min-h-11 flex-col items-center gap-1.5 rounded-xl py-1.5 transition-colors duration-200",
                isEnabled ? "cursor-pointer" : "cursor-not-allowed",
                focusRingClass,
              ].join(" ")}
            >
              <span className={`text-[11px] tracking-[0.08em] ${isEnabled ? "text-fg-muted" : "text-fg-muted/70"}`}>
                {formatWeekdayShort(d.date)}
              </span>
              <span
                className={[
                  "inline-flex h-9 w-9 items-center justify-center rounded-full text-sm tabular-nums transition-[background-color,color,box-shadow] duration-200 sm:h-10 sm:w-10 sm:text-[15px]",
                  isSel
                    ? "bg-neon font-medium text-ink"
                    : isEnabled
                      ? "text-fg group-hover:bg-bg-elev"
                      : past || beyond || closed
                        ? "text-fg-muted/70 line-through"
                        : "text-fg-muted/70",
                  isToday && !isSel ? "ring-1 ring-neon/60" : "",
                  loading ? "animate-pulse" : "",
                ].join(" ")}
              >
                {formatDayNumber(d.date)}
              </span>
              <span className="relative h-0.5 w-6" aria-hidden="true">
                {isSel ? (
                  <motion.span
                    layoutId={reduce ? undefined : "weekstrip-indicator"}
                    transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                    className="absolute inset-0 rounded-full bg-neon"
                  />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
