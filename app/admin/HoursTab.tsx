"use client";

import { useEffect, useId, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { staffMembers, staffName, type StaffKey } from "@/lib/booking";
import { admin as t } from "@/components/booking/strings";
import { WEEKDAYS_MON_FIRST, formatDayLong } from "@/lib/dates";
import { addDays, belgradeNow, fmtRange, isValidDate, toMin, weekdayOf, type Range } from "@/lib/slots";
import {
  Field,
  MULTI_STAFF,
  StatusLine,
  TimeSelect,
  cardClass,
  dangerButtonClass,
  ghostButtonClass,
  inputClass,
  primaryButtonClass,
  useAsyncAction,
} from "./ui";

/**
 * Radno vreme: nedeljni raspored po frizeru (opsezi po danu, čuva se dan po dan),
 * izuzeci po datumu (radna nedelja / radan ponedeljak / slobodan dan / posebno vreme)
 * i podešavanja termina (korak, najava, horizont, rok zahteva).
 */

type WeekRanges = Record<number, Range[]>;

function fromRows(rows: readonly Doc<"schedules">[], staffKey: StaffKey): WeekRanges {
  const out: WeekRanges = {};
  for (let d = 0; d < 7; d++) out[d] = [];
  for (const r of rows) {
    if (r.staffKey !== staffKey) continue;
    out[r.weekday].push({ startMin: r.startMin, endMin: r.endMin });
  }
  for (let d = 0; d < 7; d++) out[d].sort((a, b) => a.startMin - b.startMin);
  return out;
}

function sameWeek(a: WeekRanges, b: WeekRanges): boolean {
  for (let d = 0; d < 7; d++) {
    if (a[d].length !== b[d].length) return false;
    for (let i = 0; i < a[d].length; i++) {
      if (a[d][i].startMin !== b[d][i].startMin || a[d][i].endMin !== b[d][i].endMin) return false;
    }
  }
  return true;
}

/* ---------- Nedeljni raspored jednog frizera ---------- */

function StaffWeek({
  adminKey,
  staffKey,
  rows,
  hoursConfirmed,
}: {
  adminKey: string;
  staffKey: StaffKey;
  rows: readonly Doc<"schedules">[];
  /** false dok Chris nije ni sačuvao ni potvrdio radno vreme (baner na vrhu panela). */
  hoursConfirmed: boolean;
}) {
  const set = useMutation(api.schedules.set);
  const confirm = useMutation(api.settings.confirmHours);
  const { run, busy, error, flash } = useAsyncAction();
  const [saved, setSaved] = useState<WeekRanges>(() => fromRows(rows, staffKey));
  const [week, setWeek] = useState<WeekRanges>(saved);
  const savedKey = JSON.stringify(saved);

  // Preuzmi izmene sa servera kad se lokalno ništa ne uređuje.
  useEffect(() => {
    const adopt = () => {
      const fresh = fromRows(rows, staffKey);
      if (JSON.stringify(fresh) === savedKey) return;
      setSaved(fresh);
      setWeek((w) => (sameWeek(w, JSON.parse(savedKey) as WeekRanges) ? fresh : w));
    };
    adopt();
  }, [rows, staffKey, savedKey]);

  const dirty = !sameWeek(week, saved);

  const update = (d: number, i: number, patch: Partial<Range>) =>
    setWeek((w) => ({ ...w, [d]: w[d].map((r, j) => (j === i ? { ...r, ...patch } : r)) }));
  const remove = (d: number, i: number) => setWeek((w) => ({ ...w, [d]: w[d].filter((_, j) => j !== i) }));
  const add = (d: number) =>
    setWeek((w) => {
      const last = w[d][w[d].length - 1];
      // novi opseg kreće gde prethodni staje (bez preklapanja); ako nema mesta do 22:00, ne dodaje se
      const startMin = last ? last.endMin + 15 : toMin("09:00");
      if (startMin + 15 > toMin("22:00")) return w;
      const endMin = Math.min(startMin + 4 * 60, toMin("22:00"));
      return { ...w, [d]: [...w[d], { startMin, endMin }] };
    });

  const save = async () => {
    const ok = await run(async () => {
      for (let d = 0; d < 7; d++) {
        if (JSON.stringify(week[d]) === JSON.stringify(saved[d])) continue;
        await set({ key: adminKey, staffKey, weekday: d, ranges: week[d] });
      }
    });
    if (ok) setSaved(week);
  };

  return (
    <section className={cardClass} aria-label={MULTI_STAFF ? staffName(staffKey) : t.hours.title}>
      {MULTI_STAFF ? <h3 className="text-display text-2xl text-fg">{staffName(staffKey)}</h3> : null}
      <ul className={`divide-y divide-line ${MULTI_STAFF ? "mt-3" : ""}`}>
        {WEEKDAYS_MON_FIRST.map(({ weekday, label }) => (
          <li key={weekday} className="flex flex-col gap-2 py-3 first:pt-0 sm:flex-row sm:items-start">
            <p className="w-32 shrink-0 text-[15px] font-medium capitalize text-fg sm:pt-2.5">{label}</p>
            <div className="flex flex-1 flex-col gap-2">
              {week[weekday].length === 0 ? <p className="text-sm text-fg-muted sm:pt-2.5">{t.hours.dayOff}</p> : null}
              {week[weekday].map((r, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] text-fg-muted">{t.hours.from}</span>
                  <TimeSelect
                    value={r.startMin}
                    onChange={(v) => update(weekday, i, { startMin: v, endMin: Math.max(r.endMin, v + 30) })}
                    ariaLabel={`${label} ${t.hours.from}`}
                  />
                  <span className="text-[13px] text-fg-muted">{t.hours.to}</span>
                  <TimeSelect
                    value={r.endMin}
                    onChange={(v) => update(weekday, i, { endMin: v })}
                    min={r.startMin + 15}
                    ariaLabel={`${label} ${t.hours.to}`}
                  />
                  <button
                    type="button"
                    className={`${dangerButtonClass} px-3`}
                    onClick={() => remove(weekday, i)}
                    aria-label={`${t.remove} ${label} ${fmtRange(r.startMin, r.endMin)}`}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    <span className="hidden sm:inline">{t.remove}</span>
                  </button>
                </div>
              ))}
              <div>
                <button type="button" className={ghostButtonClass} onClick={() => add(weekday)}>
                  {t.hours.addRange}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        {dirty || hoursConfirmed ? (
          <button type="button" className={primaryButtonClass} disabled={!dirty || busy} onClick={() => void save()}>
            {t.save}
          </button>
        ) : (
          <>
            <button type="button" className={primaryButtonClass} disabled={busy} onClick={() => void run(() => confirm({ key: adminKey }))}>
              {t.hours.confirm}
            </button>
            <p className="text-sm text-fg-muted">{t.hours.confirmHint}</p>
          </>
        )}
        <StatusLine busy={busy} error={error} flash={flash} />
      </div>
    </section>
  );
}

/* ---------- Izuzeci po datumu ---------- */

type OverrideMode = "off" | "custom";
type QuickAction = "sunday" | "monday" | "off" | "custom";

/** Prvi datum (računajući i `from`) koji pada na dan u nedelji `weekday` (0 = nedelja). */
function nextWeekday(from: string, weekday: number): string {
  let d = from;
  for (let i = 0; i < 7; i++) {
    if (weekdayOf(d) === weekday) return d;
    d = addDays(d, 1);
  }
  return d;
}

function Overrides({ adminKey }: { adminKey: string }) {
  const id = useId();
  const today = belgradeNow().date;
  const to = addDays(today, 60);
  const list = useQuery(api.schedules.listOverrides, { key: adminKey, from: today, to });
  const upsert = useMutation(api.schedules.upsertOverride);
  const removeOv = useMutation(api.schedules.removeOverride);
  const { run, busy, error, flash } = useAsyncAction();

  const [mode, setMode] = useState<OverrideMode | null>(null);
  const [date, setDate] = useState(today);
  const [staff, setStaff] = useState<StaffKey | "all">(MULTI_STAFF ? "all" : staffMembers[0].key);
  const [from, setFrom] = useState(toMin("09:00"));
  const [until, setUntil] = useState(toMin("19:00"));
  const [note, setNote] = useState("");

  const open = (action: QuickAction) => {
    setMode(action === "off" ? "off" : "custom");
    setDate(action === "sunday" ? nextWeekday(today, 0) : action === "monday" ? nextWeekday(today, 1) : today);
    setFrom(action === "sunday" ? toMin("10:00") : toMin("09:00"));
    setUntil(action === "sunday" ? toMin("17:00") : toMin("19:00"));
    setNote("");
  };

  const submit = async () => {
    if (!mode) return;
    const targets: StaffKey[] = staff === "all" ? staffMembers.map((m) => m.key) : [staff];
    const ok = await run(async () => {
      for (const staffKey of targets) {
        await upsert({
          key: adminKey,
          staffKey,
          date,
          kind: mode,
          startMin: mode === "off" ? undefined : from,
          endMin: mode === "off" ? undefined : until,
          note: note.trim() || undefined,
        });
      }
    });
    if (ok) setMode(null);
  };

  const sorted = list
    ? [...list].sort((a, b) =>
        a.date < b.date ? -1 : a.date > b.date ? 1 : a.staffKey < b.staffKey ? -1 : a.staffKey > b.staffKey ? 1 : 0,
      )
    : [];

  return (
    <section className={cardClass} aria-labelledby={`${id}-h`}>
      <h3 id={`${id}-h`} className="text-display text-2xl text-fg">
        {t.hours.overridesTitle}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-fg-muted">{t.hours.overridesIntro}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={ghostButtonClass} onClick={() => open("sunday")}>
          {t.hours.addWorkingSunday}
        </button>
        <button type="button" className={ghostButtonClass} onClick={() => open("monday")}>
          {t.hours.addWorkingMonday}
        </button>
        <button type="button" className={ghostButtonClass} onClick={() => open("off")}>
          {t.hours.addDayOff}
        </button>
        <button type="button" className={ghostButtonClass} onClick={() => open("custom")}>
          {t.hours.addCustom}
        </button>
      </div>

      {mode ? (
        <form
          className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-bg p-4 sm:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <Field label={t.calendar.date} htmlFor={`${id}-date`} className={MULTI_STAFF ? "" : "col-span-2"}>
            <input
              id={`${id}-date`}
              type="date"
              className={`${inputClass} tabular-nums`}
              value={date}
              min={today}
              onChange={(e) => isValidDate(e.target.value) && setDate(e.target.value)}
              required
            />
          </Field>
          {MULTI_STAFF ? (
            <Field label={t.calendar.manual.staff} htmlFor={`${id}-staff`}>
              <select
                id={`${id}-staff`}
                className={inputClass}
                value={staff}
                onChange={(e) => setStaff(e.target.value as StaffKey | "all")}
              >
                <option value="all">{t.hours.allStaff}</option>
                {staffMembers.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          {mode === "custom" ? (
            <>
              <Field label={t.hours.from} htmlFor={`${id}-from`}>
                <TimeSelect
                  id={`${id}-from`}
                  value={from}
                  onChange={(v) => {
                    setFrom(v);
                    if (until <= v) setUntil(v + 60);
                  }}
                  className="w-full"
                />
              </Field>
              <Field label={t.hours.to} htmlFor={`${id}-to`}>
                <TimeSelect id={`${id}-to`} value={until} onChange={setUntil} min={from + 15} className="w-full" />
              </Field>
            </>
          ) : null}
          <Field label={t.hours.note} htmlFor={`${id}-note`} className="col-span-2 sm:col-span-4">
            <input id={`${id}-note`} className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} />
          </Field>
          <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-4">
            <button type="submit" className={primaryButtonClass} disabled={busy}>
              {t.save}
            </button>
            <button type="button" className={ghostButtonClass} onClick={() => setMode(null)}>
              {t.cancel}
            </button>
            <StatusLine busy={busy} error={error} flash={flash} />
          </div>
        </form>
      ) : (
        <StatusLine busy={busy} error={error} flash={flash} className="mt-3" />
      )}

      {list === undefined ? (
        <p className="mt-3 text-fg-muted">{t.loading}</p>
      ) : sorted.length === 0 ? (
        <p className="mt-3 text-sm text-fg-muted">{t.hours.noOverrides}</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {sorted.map((o) => (
            <li key={o._id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[15px]">
              <span className="min-w-0">
                <span className="font-medium text-fg">{formatDayLong(o.date)}</span>
                <span className="text-fg-muted">
                  {MULTI_STAFF ? ` · ${staffName(o.staffKey)}` : ""} ·{" "}
                  {o.kind === "off" ? t.hours.kindOff : `${t.hours.kindCustom} ${fmtRange(o.startMin ?? 0, o.endMin ?? 0)}`}
                  {o.note ? ` · ${o.note}` : ""}
                </span>
              </span>
              <button
                type="button"
                className={`${dangerButtonClass} px-3`}
                disabled={busy}
                onClick={() => void run(() => removeOv({ key: adminKey, id: o._id }))}
                aria-label={`${t.remove} ${formatDayLong(o.date)}`}
              >
                <Trash2 size={16} aria-hidden="true" />
                {t.remove}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------- Podešavanja termina ---------- */

type SettingsForm = { slotStepMin: number; leadTimeMin: number; horizonDays: number; holdHours: number };

/** `settings.get` vraća i `hoursConfirmed` — u formu i mutaciju idu samo četiri broja. */
function pickSettings(s: SettingsForm): SettingsForm {
  return { slotStepMin: s.slotStepMin, leadTimeMin: s.leadTimeMin, horizonDays: s.horizonDays, holdHours: s.holdHours };
}

function SettingsCard({ adminKey }: { adminKey: string }) {
  const id = useId();
  const settings = useQuery(api.settings.get, { key: adminKey });
  const update = useMutation(api.settings.update);
  const { run, busy, error, flash } = useAsyncAction();
  const [form, setForm] = useState<SettingsForm | null>(null);
  const current: SettingsForm | null = form ?? (settings ? pickSettings(settings) : null);

  const num = (key: keyof SettingsForm, label: string, min: number, max: number, step = 1) => (
    <Field label={label} htmlFor={`${id}-${key}`}>
      <input
        id={`${id}-${key}`}
        type="number"
        inputMode="numeric"
        className={`${inputClass} tabular-nums`}
        min={min}
        max={max}
        step={step}
        value={current ? current[key] : ""}
        disabled={!current}
        onChange={(e) => current && setForm({ ...current, [key]: Number(e.target.value) })}
      />
    </Field>
  );

  return (
    <section className={cardClass} aria-labelledby={`${id}-h`}>
      <h3 id={`${id}-h`} className="text-display text-2xl text-fg">
        {t.hours.settingsTitle}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-fg-muted">{t.hours.settingsIntro}</p>
      <form
        className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form) return;
          void run(() => update({ key: adminKey, ...form })).then((ok) => {
            if (ok) setForm(null);
          });
        }}
      >
        {num("slotStepMin", t.hours.step, 5, 120, 5)}
        {num("leadTimeMin", t.hours.lead, 0, 10080, 30)}
        {num("horizonDays", t.hours.horizon, 1, 365)}
        {num("holdHours", t.hours.hold, 1, 720)}
        <div className="col-span-2 flex flex-wrap items-center gap-3 sm:col-span-4">
          <button type="submit" className={primaryButtonClass} disabled={!form || busy}>
            {t.hours.saveSettings}
          </button>
          <StatusLine busy={busy} error={error} flash={flash} />
        </div>
      </form>
    </section>
  );
}

export default function HoursTab({ adminKey }: { adminKey: string }) {
  const rows = useQuery(api.schedules.listWeekly, { key: adminKey });
  const status = useQuery(api.admin.status, { key: adminKey });
  if (rows === undefined) return <p className="text-fg-muted">{t.loading}</p>;
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-display text-3xl text-fg">{t.hours.title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-muted">{t.hours.intro}</p>
      </div>
      <div className={`grid gap-5 ${MULTI_STAFF ? "xl:grid-cols-2" : ""}`}>
        {staffMembers.map((m) => (
          <StaffWeek key={m.key} adminKey={adminKey} staffKey={m.key} rows={rows} hoursConfirmed={status?.hoursConfirmed ?? true} />
        ))}
      </div>
      <Overrides adminKey={adminKey} />
      <SettingsCard adminKey={adminKey} />
    </div>
  );
}
