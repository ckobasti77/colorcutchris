"use client";

import { useState } from "react";
import { motion } from "motion/react";

const labels = ["", "Hm.", "Može bolje.", "Dobro.", "Odlično.", "Najbolji u gradu."];

/**
 * "Ostavi recenziju" — namerno samo vizuelno.
 * Jedino što radi: klik/hover puni zvezdice. Nema slanja, nema pozadine.
 * (Kad zatreba pravo dugme: `writeReviewUrl` iz lib/site.ts vodi na Google formu.)
 */
export function ReviewPrompt() {
  const [picked, setPicked] = useState(0);
  const [hover, setHover] = useState(0);
  const shown = hover || picked;

  return (
    <div className="grid gap-8 rounded-[28px] border border-line bg-bg-elev/60 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-accent">Bio/bila si kod Chrisa?</p>
        <h3 className="text-display mt-2 text-3xl text-fg">Ostavi recenziju.</h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-fg-muted">
          Dve rečenice o tome kako je prošlo pomažu sledećoj osobi da se odluči. Bez retuša, kao i
          sve ostalo ovde.
        </p>
      </div>

      <div className="flex flex-col items-start gap-3 md:items-end">
        <div
          className="flex gap-1"
          role="radiogroup"
          aria-label="Ocena"
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => {
            const on = n <= shown;
            return (
              <motion.button
                key={n}
                type="button"
                role="radio"
                aria-checked={picked === n}
                aria-label={`${n} od 5`}
                onMouseEnter={() => setHover(n)}
                onFocus={() => setHover(n)}
                onBlur={() => setHover(0)}
                onClick={() => setPicked(n)}
                whileTap={{ scale: 0.85 }}
                animate={{ scale: on && picked === n ? [1, 1.25, 1] : 1 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className={`grid h-11 w-11 place-items-center rounded-full transition-colors ${
                  on ? "text-neon" : "text-fg-muted/40"
                } hover:bg-bg-elev focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon`}
              >
                <svg viewBox="0 0 20 20" className="h-6 w-6" aria-hidden>
                  <path
                    d="M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6L10 15l-5.4 3 1.2-6L1.3 7.8l6.1-.7z"
                    fill={on ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth={1.4}
                    strokeLinejoin="round"
                    style={on ? { filter: "drop-shadow(0 0 6px rgba(245,230,99,.55))" } : undefined}
                  />
                </svg>
              </motion.button>
            );
          })}
        </div>
        <p className="h-5 text-xs text-fg-muted" aria-live="polite">
          {labels[shown]}
        </p>
        <span
          aria-disabled="true"
          data-reveal="off"
          className="inline-flex h-11 cursor-default select-none items-center rounded-full border border-line px-5 text-sm text-fg-muted"
        >
          Napiši recenziju na Google-u
        </span>
      </div>
    </div>
  );
}
