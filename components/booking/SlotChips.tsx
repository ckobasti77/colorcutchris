"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Phone } from "lucide-react";
import { staffName, staffNameGenitive, type StaffKey } from "@/lib/booking";
import { fmt, fmtRange, groupByPartOfDay } from "@/lib/slots";
import { site } from "@/lib/site";
import { booking } from "./strings";
import { useRovingRadio } from "./useRovingRadio";
import { chipClass, eyebrowClass, secondaryButtonClass } from "./wizardStyles";

export type SlotOption = { startMin: number; staff: readonly StaffKey[] };

type Props = {
  /** undefined = učitava se */
  slots: readonly SlotOption[] | undefined;
  selected: number | null;
  durationMin: number;
  /** true kad je izabrano „Svejedno", a termin nudi samo jedan frizer */
  showStaffHint: boolean;
  onSelect: (startMin: number) => void;
};

function Skeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      {[5, 7].map((n, g) => (
        <div key={g}>
          <div className="mb-3 h-3 w-20 animate-pulse rounded-full bg-fg/[0.08]" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: n }).map((_, i) => (
              <div key={i} className="h-11 w-[78px] animate-pulse rounded-full bg-fg/[0.06]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

type GroupProps = {
  id: string;
  label: string;
  starts: readonly number[];
  byStart: ReadonlyMap<number, SlotOption>;
  selected: number | null;
  durationMin: number;
  showStaffHint: boolean;
  onSelect: (startMin: number) => void;
};

/** Jedna radio grupa (Prepodne ili Popodne): jedan tab-stop, strelice biraju. */
function SlotGroup({ id, label, starts, byStart, selected, durationMin, showStaffHint, onSelect }: GroupProps) {
  const reduce = useReducedMotion() ?? false;
  const selectedIndex = selected === null ? -1 : starts.indexOf(selected);
  const { rovingIndex, setRef, onKeyDown } = useRovingRadio<HTMLButtonElement>(starts.length, selectedIndex, (i) =>
    onSelect(starts[i]),
  );

  return (
    <div>
      <p id={id} className={`${eyebrowClass} mb-3`}>
        {label}
      </p>
      <div role="radiogroup" aria-labelledby={id} className="flex flex-wrap gap-2">
        {starts.map((start, i) => {
          const isSel = start === selected;
          const opt = byStart.get(start);
          const single = showStaffHint && opt && opt.staff.length === 1 ? opt.staff[0] : null;
          return (
            <motion.button
              key={start}
              ref={setRef(i)}
              type="button"
              role="radio"
              aria-checked={isSel}
              tabIndex={i === rovingIndex ? 0 : -1}
              aria-label={`${fmtRange(start, start + durationMin)}${single ? `, ${booking.day.withStaff(staffNameGenitive(single))}` : ""}`}
              onClick={() => onSelect(start)}
              onKeyDown={(e) => onKeyDown(e, i)}
              whileTap={reduce ? undefined : { scale: 0.94 }}
              transition={{ duration: 0.15 }}
              className={chipClass(isSel)}
            >
              <span>{fmt(start)}</span>
              {single ? (
                <span className={`ml-1.5 text-[11px] ${isSel ? "text-ink/70" : "text-fg-muted"}`}>{staffName(single)}</span>
              ) : null}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/** Slobodni počeci jednog dana, podeljeni na prepodne i popodne. */
export function SlotChips({ slots, selected, durationMin, showStaffHint, onSelect }: Props) {
  const baseId = useId();

  if (slots === undefined) return <Skeleton />;

  if (slots.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-bg/60 p-5">
        <p className="text-[15px] leading-relaxed text-fg">{booking.day.empty}</p>
        <a href={site.phone.href} className={`${secondaryButtonClass} mt-4 gap-2`}>
          <Phone size={16} aria-hidden="true" />
          {booking.errors.callUs}
          <span className="tabular-nums text-fg-muted">{site.phone.display}</span>
        </a>
      </div>
    );
  }

  const byStart = new Map(slots.map((s) => [s.startMin, s]));
  const groups = groupByPartOfDay(slots.map((s) => s.startMin));
  const sections = [
    { id: `${baseId}-am`, label: booking.day.prepodne, starts: groups.prepodne },
    { id: `${baseId}-pm`, label: booking.day.popodne, starts: groups.popodne },
  ].filter((s) => s.starts.length > 0);

  return (
    <div className="space-y-6">
      {sections.map((sec) => (
        <SlotGroup
          key={sec.id}
          id={sec.id}
          label={sec.label}
          starts={sec.starts}
          byStart={byStart}
          selected={selected}
          durationMin={durationMin}
          showStaffHint={showStaffHint}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
