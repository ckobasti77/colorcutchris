/**
 * Deljene klase wizard-a za zakazivanje. Samo semantički tokeni (bg-bg, text-fg,
 * border-line, bg-accent…) — sekcija živi u noćnoj temi, a iste klase rade i u
 * dnevnoj. Neon je akcenat: fokus, selekcija, glow.
 */

/** Ista kriva kao ostatak sajta (ease-out-expo). */
export const wizardEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const focusRingClass =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export const eyebrowClass = "text-xs font-medium uppercase tracking-[0.22em] text-accent";

export const inputClass =
  "h-12 w-full rounded-xl border border-line bg-bg px-4 text-fg placeholder:text-fg-muted outline-none transition-[box-shadow,border-color] duration-200 focus:ring-2 focus:ring-focus aria-[invalid=true]:border-rattan";

export const labelClass = "mb-1.5 block text-sm font-medium text-fg";

export const errorClass = "mt-1.5 text-sm text-rattan";

export const primaryButtonClass = [
  "inline-flex h-12 w-full items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-accent-fg",
  "transition-[transform,opacity] duration-200 ease-out-expo enabled:hover:-translate-y-0.5 motion-safe:active:scale-[0.98]",
  "disabled:cursor-not-allowed disabled:opacity-50",
  focusRingClass,
].join(" ");

export const secondaryButtonClass = [
  "inline-flex h-12 items-center justify-center rounded-full border border-line px-5 text-sm font-medium text-fg",
  "transition-colors duration-200 hover:bg-bg motion-safe:active:scale-[0.98]",
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent",
  focusRingClass,
].join(" ");

/** Čip za vreme (i sve slično „pilulasto"). Prosledi `selected`. */
export function chipClass(selected: boolean, extra = ""): string {
  return [
    "inline-flex h-11 min-w-[78px] items-center justify-center rounded-full border px-4 text-[15px] tabular-nums transition-colors duration-200 select-none",
    selected ? "border-neon bg-neon font-medium text-ink" : "border-line bg-bg text-fg hover:border-neon/40",
    focusRingClass,
    extra,
  ].join(" ");
}
