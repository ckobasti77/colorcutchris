"use client";

import { Check } from "lucide-react";
import { booking } from "./strings";
import { focusRingClass } from "./wizardStyles";

/** Tri koraka: klik na završeni vraća nazad; tekući i budući su samo indikatori. */
export function StepDots({ step, onJump, disabled = false }: { step: number; onJump: (i: number) => void; disabled?: boolean }) {
  const n = booking.steps.length;
  return (
    <ol className="flex items-center gap-1.5 sm:gap-2" aria-label={booking.stepOf(step + 1, n)}>
      {booking.steps.map((label, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <li key={label} className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => done && !disabled && onJump(i)}
              disabled={!done || disabled}
              aria-current={current ? "step" : undefined}
              className={[
                "flex h-11 items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[13px] transition-colors duration-200",
                current ? "bg-neon/10 text-fg" : done ? "text-fg hover:bg-bg" : "text-fg-muted",
                done && !disabled ? "cursor-pointer" : "cursor-default",
                focusRingClass,
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className={[
                  "inline-flex h-7 w-7 items-center justify-center rounded-full text-[12px] tabular-nums transition-colors duration-200",
                  current
                    ? "bg-neon font-medium text-ink"
                    : done
                      ? "bg-neon/15 text-neon"
                      : "border border-line text-fg-muted",
                ].join(" ")}
              >
                {done ? <Check size={14} strokeWidth={2.5} /> : i + 1}
              </span>
              <span className={current ? "" : "sr-only sm:not-sr-only"}>{label}</span>
            </button>
            {i < n - 1 ? <span aria-hidden="true" className="h-px w-3 bg-line sm:w-6" /> : null}
          </li>
        );
      })}
    </ol>
  );
}
