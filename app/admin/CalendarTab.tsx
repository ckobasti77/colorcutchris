"use client";

import { useCallback, useEffect, useId, useState, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence } from "motion/react";
import { Check, ChevronLeft, ChevronRight, Phone, Trash2, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { bookableServices, findBookableService, staffMembers, staffName, type StaffKey } from "@/lib/booking";
import { admin as t, statusLabel } from "@/components/booking/strings";
import { formatDayLong } from "@/lib/dates";
import { addDays, belgradeNow, fmt, fmtRange, isValidDate, normalizeRanges, weekdayOf, type Range } from "@/lib/slots";
import { Modal } from "./Modal";
import {
  Field,
  MULTI_STAFF,
  StatusLine,
  TimeSelect,
  compactInputClass,
  dangerButtonClass,
  focusRingClass,
  ghostButtonClass,
  inputClass,
  primaryButtonClass,
  useAsyncAction,
} from "./ui";

/**
 * Dnevni kalendar: kolona po frizeru, redovi na 30 min (08:00–21:00). Klik na
 * prazno vreme → Dodaj termin / Blokiraj; klik na termin → potvrdi/odbij/otkaži;
 * klik na pauzu → ukloni. Van radnog vremena je zatamnjeno po nedeljnom rasporedu
 * i izuzecima za taj datum.
 */

/** Podrazumevani prozor 08–21; širi se (na pun sat) kad radno vreme, termin ili pauza tog dana izlaze iz njega. */
const DAY_START = 8 * 60;
const DAY_END = 21 * 60;
const ROW_MIN = 30;
const ROW_PX = 44;
const TIME_COL_PX = 56;

type Grid = { start: number; end: number; rows: readonly number[]; height: number };

function makeGrid(start: number, end: number): Grid {
  const n = Math.max(1, Math.round((end - start) / ROW_MIN));
  return { start, end, rows: Array.from({ length: n }, (_, i) => start + i * ROW_MIN), height: n * ROW_PX };
}

function gridFor(spans: readonly Range[]): Grid {
  let start = DAY_START;
  let end = DAY_END;
  for (const r of spans) {
    start = Math.min(start, Math.floor(r.startMin / 60) * 60);
    end = Math.max(end, Math.ceil(r.endMin / 60) * 60);
  }
  return makeGrid(Math.max(0, start), Math.min(24 * 60, end));
}
const STAFF_COL_MIN_PX = 264;

/** Sat na minut — linija „sada“ i „danas“ se pomeraju i dok je kartica otvorena. */
function useMinuteClock() {
  const [now, setNow] = useState(() => belgradeNow());
  useEffect(() => {
    const tick = () =>
      setNow((prev) => {
        const next = belgradeNow();
        return prev.minutes === next.minutes && prev.date === next.date ? prev : next;
      });
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

type Booking = Doc<"bookings">;
type Block = Doc<"blocks">;

type Sheet =
  | { kind: "cell"; staffKey: StaffKey; startMin: number }
  | { kind: "manual"; staffKey: StaffKey; startMin: number }
  | { kind: "block"; staffKey: StaffKey; startMin: number }
  | { kind: "booking"; booking: Booking }
  | { kind: "blockInfo"; block: Block }
  | null;

function top(grid: Grid, min: number): number {
  return ((min - grid.start) / ROW_MIN) * ROW_PX;
}

/** Položaj bloka u gridu: sečen na prozor grida, nikad niži od pola reda. */
function blockBox(grid: Grid, startMin: number, endMin: number): { top: number; height: number } {
  const s = Math.max(startMin, grid.start);
  const e = Math.min(endMin, grid.end);
  return { top: top(grid, s) + 1, height: Math.max(ROW_PX / 2, top(grid, e) - top(grid, s) - 2) };
}

function workRangesFor(
  staffKey: StaffKey,
  date: string,
  schedules: readonly Doc<"schedules">[],
  overrides: readonly Doc<"scheduleOverrides">[],
): { ranges: Range[]; label: string | null } {
  const ov = overrides.find((o) => o.staffKey === staffKey && o.date === date);
  if (ov) {
    if (ov.kind === "off" || ov.startMin === undefined || ov.endMin === undefined) return { ranges: [], label: t.calendar.off };
    return { ranges: [{ startMin: ov.startMin, endMin: ov.endMin }], label: t.calendar.custom };
  }
  const wd = weekdayOf(date);
  const rows = schedules.filter((s) => s.staffKey === staffKey && s.weekday === wd);
  return {
    ranges: normalizeRanges(rows.map((r) => ({ startMin: r.startMin, endMin: r.endMin }))),
    label: rows.length === 0 ? t.calendar.closed : null,
  };
}

/** Zaglavlje kolone: „radno vreme · 09:00–19:00", „neradan dan", „posebno radno vreme · 10:00–17:00". */
function hoursLabel(ranges: readonly Range[], label: string | null): string {
  const times = ranges.map((r) => fmtRange(r.startMin, r.endMin)).join(", ");
  if (label) return times ? `${label} · ${times}` : label;
  return times ? `${t.calendar.workHours} · ${times}` : t.calendar.closed;
}

function sheetTitle(sheet: NonNullable<Sheet>): string {
  switch (sheet.kind) {
    case "cell":
      return MULTI_STAFF ? `${staffName(sheet.staffKey)} · ${fmt(sheet.startMin)}` : fmt(sheet.startMin);
    case "manual":
      return t.calendar.manual.title;
    case "block":
      return t.calendar.blockForm.title;
    case "booking":
      return statusLabel(sheet.booking.status);
    case "blockInfo":
      return t.calendar.legend.block;
  }
}

/* ---------- Forme ---------- */

function StaffSelect({ id, value, onChange }: { id: string; value: StaffKey; onChange: (v: StaffKey) => void }) {
  return (
    <select id={id} className={inputClass} value={value} onChange={(e) => onChange(e.target.value as StaffKey)}>
      {staffMembers.map((m) => (
        <option key={m.key} value={m.key}>
          {m.name}
        </option>
      ))}
    </select>
  );
}

function ManualForm({
  adminKey,
  staffKey,
  startMin,
  date,
  onDone,
}: {
  adminKey: string;
  staffKey: StaffKey;
  startMin: number;
  date: string;
  onDone: () => void;
}) {
  const id = useId();
  const create = useMutation(api.bookings.createManual);
  const overrides = useQuery(api.services.overrides, {});
  const { run, busy, error, flash } = useAsyncAction();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceKey, setServiceKey] = useState(bookableServices[0].key);
  const [staff, setStaff] = useState<StaffKey>(staffKey);
  const [start, setStart] = useState(startMin);
  const [note, setNote] = useState("");
  const [durationTouched, setDurationTouched] = useState<number | null>(null);

  const service = findBookableService(serviceKey) ?? bookableServices[0];
  const defaultDuration = overrides?.find((o) => o.serviceKey === serviceKey)?.durationMin ?? service.durationMin;
  const duration = durationTouched ?? defaultDuration;

  const submit = async () => {
    const ok = await run(() =>
      create({
        key: adminKey,
        name,
        phone: phone.trim() || undefined,
        serviceKey,
        staffKey: staff,
        date,
        startMin: start,
        durationMin: duration,
        note: note.trim() || undefined,
      }),
    );
    if (ok) onDone();
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <p className="text-sm text-fg-muted">{formatDayLong(date)}</p>
      <Field label={t.calendar.manual.name} htmlFor={`${id}-name`}>
        <input
          id={`${id}-name`}
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={60}
          autoComplete="off"
          autoFocus
        />
      </Field>
      <Field label={t.calendar.manual.phone} htmlFor={`${id}-phone`}>
        <input
          id={`${id}-phone`}
          className={inputClass}
          type="tel"
          inputMode="tel"
          autoComplete="off"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </Field>
      <Field label={t.calendar.manual.service} htmlFor={`${id}-service`}>
        <select
          id={`${id}-service`}
          className={inputClass}
          value={serviceKey}
          onChange={(e) => {
            setServiceKey(e.target.value);
            setDurationTouched(null);
          }}
        >
          {bookableServices.map((s) => (
            <option key={s.key} value={s.key}>
              {s.title}
            </option>
          ))}
        </select>
      </Field>
      <div className={`grid grid-cols-2 gap-3 ${MULTI_STAFF ? "sm:grid-cols-3" : ""}`}>
        {MULTI_STAFF ? (
          <Field label={t.calendar.manual.staff} htmlFor={`${id}-staff`} className="col-span-2 sm:col-span-1">
            <StaffSelect id={`${id}-staff`} value={staff} onChange={setStaff} />
          </Field>
        ) : null}
        <Field label={t.calendar.manual.start} htmlFor={`${id}-start`}>
          <TimeSelect id={`${id}-start`} value={start} onChange={setStart} className="w-full" />
        </Field>
        <Field label={t.calendar.manual.duration} htmlFor={`${id}-dur`}>
          <input
            id={`${id}-dur`}
            className={`${inputClass} tabular-nums`}
            type="number"
            inputMode="numeric"
            min={5}
            max={480}
            step={5}
            value={duration}
            onChange={(e) => setDurationTouched(Number(e.target.value))}
          />
        </Field>
      </div>
      <Field label={t.calendar.manual.note} htmlFor={`${id}-note`}>
        <input id={`${id}-note`} className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
      </Field>
      <StatusLine busy={busy} error={error} flash={flash} />
      <button type="submit" className={`${primaryButtonClass} w-full`} disabled={busy}>
        {t.calendar.manual.save}
      </button>
    </form>
  );
}

function BlockForm({
  adminKey,
  staffKey,
  startMin,
  date,
  onDone,
}: {
  adminKey: string;
  staffKey: StaffKey;
  startMin: number;
  date: string;
  onDone: () => void;
}) {
  const id = useId();
  const add = useMutation(api.blocks.add);
  const { run, busy, error, flash } = useAsyncAction();
  const [staff, setStaff] = useState<StaffKey>(staffKey);
  const [from, setFrom] = useState(startMin);
  const [to, setTo] = useState(Math.min(startMin + 60, DAY_END));
  const [reason, setReason] = useState("");

  const submit = async () => {
    const ok = await run(() =>
      add({ key: adminKey, staffKey: staff, date, startMin: from, endMin: to, reason: reason.trim() || undefined }),
    );
    if (ok) onDone();
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <p className="text-sm text-fg-muted">{formatDayLong(date)}</p>
      <div className={`grid grid-cols-2 gap-3 ${MULTI_STAFF ? "sm:grid-cols-3" : ""}`}>
        {MULTI_STAFF ? (
          <Field label={t.calendar.blockForm.staff} htmlFor={`${id}-staff`} className="col-span-2 sm:col-span-1">
            <StaffSelect id={`${id}-staff`} value={staff} onChange={setStaff} />
          </Field>
        ) : null}
        <Field label={t.calendar.blockForm.from} htmlFor={`${id}-from`}>
          <TimeSelect
            id={`${id}-from`}
            value={from}
            onChange={(v) => {
              setFrom(v);
              if (to <= v) setTo(v + 30);
            }}
            className="w-full"
          />
        </Field>
        <Field label={t.calendar.blockForm.to} htmlFor={`${id}-to`}>
          <TimeSelect id={`${id}-to`} value={to} onChange={setTo} min={from + 15} className="w-full" />
        </Field>
      </div>
      <Field label={t.calendar.blockForm.reason} htmlFor={`${id}-reason`}>
        <input
          id={`${id}-reason`}
          className={inputClass}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t.calendar.blockForm.reasonPlaceholder}
          maxLength={120}
        />
      </Field>
      <StatusLine busy={busy} error={error} flash={flash} />
      <button type="submit" className={`${primaryButtonClass} w-full`} disabled={busy}>
        {t.calendar.blockForm.save}
      </button>
    </form>
  );
}

function BookingActions({ adminKey, booking, onDone }: { adminKey: string; booking: Booking; onDone: () => void }) {
  const setStatus = useMutation(api.bookings.setStatus);
  const { run, busy, error, flash } = useAsyncAction();
  const act = async (status: Booking["status"]) => {
    const ok = await run(() => setStatus({ key: adminKey, id: booking._id, status }));
    if (ok) onDone();
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-display text-xl text-fg">{booking.serviceTitle}</p>
        <p className="mt-1.5 text-sm text-fg-muted">
          {MULTI_STAFF ? `${staffName(booking.staffKey)} · ` : ""}
          {formatDayLong(booking.date)} · <span className="tabular-nums">{fmtRange(booking.startMin, booking.endMin)}</span>
        </p>
        <p className="mt-3 text-[15px] font-medium text-fg">{booking.name}</p>
        {booking.phone ? (
          <a
            href={`tel:${booking.phone}`}
            className="inline-flex min-h-11 items-center gap-1.5 tabular-nums text-accent underline underline-offset-4"
          >
            <Phone size={14} aria-hidden="true" />
            {booking.phone}
          </a>
        ) : null}
        {booking.note ? <p className="mt-2 rounded-xl bg-bg px-3 py-2 text-sm leading-relaxed text-fg">{booking.note}</p> : null}
        <p className="mt-3 text-[13px] text-fg-muted">{statusLabel(booking.status)}</p>
      </div>
      <StatusLine busy={busy} error={error} flash={flash} />
      <div className="flex flex-wrap gap-2">
        {booking.status === "nov" ? (
          <>
            <button type="button" className={primaryButtonClass} disabled={busy} onClick={() => void act("potvrdjen")}>
              <Check size={16} aria-hidden="true" />
              {t.calendar.confirm}
            </button>
            <button type="button" className={dangerButtonClass} disabled={busy} onClick={() => void act("odbijen")}>
              <X size={16} aria-hidden="true" />
              {t.calendar.decline}
            </button>
          </>
        ) : null}
        {booking.status === "potvrdjen" ? (
          <button type="button" className={dangerButtonClass} disabled={busy} onClick={() => void act("otkazan")}>
            <X size={16} aria-hidden="true" />
            {t.calendar.cancel}
          </button>
        ) : null}
        {booking.phone ? (
          <a href={`tel:${booking.phone}`} className={ghostButtonClass}>
            <Phone size={16} aria-hidden="true" />
            {t.calendar.call}
          </a>
        ) : null}
      </div>
    </div>
  );
}

function BlockInfo({ adminKey, block, onDone }: { adminKey: string; block: Block; onDone: () => void }) {
  const remove = useMutation(api.blocks.remove);
  const { run, busy, error, flash } = useAsyncAction();
  return (
    <div className="space-y-4">
      <p className="text-[15px] text-fg">
        {MULTI_STAFF ? `${staffName(block.staffKey)} · ` : ""}
        <span className="tabular-nums">{fmtRange(block.startMin, block.endMin)}</span>
        {block.reason ? ` · ${block.reason}` : ""}
      </p>
      <StatusLine busy={busy} error={error} flash={flash} />
      <button
        type="button"
        className={dangerButtonClass}
        disabled={busy}
        onClick={async () => {
          const ok = await run(() => remove({ key: adminKey, id: block._id }));
          if (ok) onDone();
        }}
      >
        <Trash2 size={16} aria-hidden="true" />
        {t.calendar.removeBlock}
      </button>
    </div>
  );
}

/**
 * Termin ili pauza u gridu. Kratke stavke (< 30 min, npr. šiške 15 min) zadržavaju
 * pravu vizuelnu visinu, ali je dugme visoko bar koliko red (44 px) — Chris ih
 * tapka prstom na telefonu.
 */
function GridItem({
  box,
  z,
  visualClass,
  onClick,
  children,
}: {
  box: { top: number; height: number };
  z: string;
  visualClass: string;
  onClick: () => void;
  children: ReactNode;
}) {
  if (box.height >= ROW_PX) {
    return (
      <button type="button" onClick={onClick} className={`absolute inset-x-1 ${z} ${visualClass} ${focusRingClass}`} style={box}>
        {children}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute inset-x-1 ${z} rounded-lg ${focusRingClass}`}
      style={{ top: box.top, height: ROW_PX }}
    >
      <span className={`absolute inset-x-0 top-0 block ${visualClass}`} style={{ height: box.height }}>
        {children}
      </span>
    </button>
  );
}

/* ---------- Dnevni grid ---------- */

export default function CalendarTab({ adminKey }: { adminKey: string }) {
  const [date, setDate] = useState(() => belgradeNow().date);
  const [sheet, setSheet] = useState<Sheet>(null);
  const close = useCallback(() => setSheet(null), []);

  const bookings = useQuery(api.bookings.listRange, { key: adminKey, from: date, to: date });
  const blocks = useQuery(api.blocks.listDay, { key: adminKey, date });
  const schedules = useQuery(api.schedules.listWeekly, { key: adminKey });
  const overrides = useQuery(api.schedules.listOverrides, { key: adminKey, from: date, to: date });

  const now = useMinuteClock();
  const today = now.date;
  const loading = bookings === undefined || blocks === undefined || schedules === undefined || overrides === undefined;
  const activeBookings = bookings?.filter((b) => b.status === "nov" || b.status === "potvrdjen") ?? [];
  const dayEmpty = !loading && activeBookings.length === 0 && blocks.length === 0;
  const gridColumns = `${TIME_COL_PX}px repeat(${staffMembers.length}, minmax(0, 1fr))`;
  const grid = loading
    ? makeGrid(DAY_START, DAY_END)
    : gridFor([
        ...staffMembers.flatMap((m) => workRangesFor(m.key, date, schedules ?? [], overrides ?? []).ranges),
        ...activeBookings.map((b) => ({ startMin: b.startMin, endMin: b.endMin })),
        ...(blocks ?? []).map((b) => ({ startMin: b.startMin, endMin: b.endMin })),
      ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-display text-2xl text-fg">{formatDayLong(date)}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`${ghostButtonClass} w-11 px-0`}
            onClick={() => setDate(addDays(date, -1))}
            aria-label={t.calendar.prev}
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <input
            type="date"
            className={`${compactInputClass} tabular-nums`}
            value={date}
            onChange={(e) => isValidDate(e.target.value) && setDate(e.target.value)}
            aria-label={t.calendar.date}
          />
          <button
            type="button"
            className={`${ghostButtonClass} w-11 px-0`}
            onClick={() => setDate(addDays(date, 1))}
            aria-label={t.calendar.next}
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
          <button type="button" className={ghostButtonClass} onClick={() => setDate(today)} disabled={date === today}>
            {t.calendar.today}
          </button>
        </div>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-muted">
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-accent" aria-hidden="true" />
          {t.calendar.legend.confirmed}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border-2 border-accent bg-bg-elev" aria-hidden="true" />
          {t.calendar.legend.pending}
        </li>
        <li className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-sm bg-[repeating-linear-gradient(45deg,#d9c9b0_0_4px,#f4efe6_4px_8px)]"
            aria-hidden="true"
          />
          {t.calendar.legend.block}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-cream-deep" aria-hidden="true" />
          {t.calendar.legend.closed}
        </li>
      </ul>

      {loading ? (
        <p className="text-fg-muted">{t.loading}</p>
      ) : (
        <>
          {dayEmpty ? <p className="text-sm text-fg-muted">{t.calendar.empty}</p> : null}
          <div data-lenis-prevent className="overflow-x-auto rounded-[24px] border border-line bg-bg-elev">
            <div style={{ minWidth: TIME_COL_PX + staffMembers.length * STAFF_COL_MIN_PX }}>
              <div className="grid border-b border-line text-center text-sm" style={{ gridTemplateColumns: gridColumns }}>
                <div />
                {staffMembers.map((m) => {
                  const { ranges, label } = workRangesFor(m.key, date, schedules, overrides);
                  return (
                    <div key={m.key} className="px-2 py-2.5">
                      {MULTI_STAFF ? <span className="font-medium text-fg">{m.name}</span> : null}
                      <span className={`text-xs text-fg-muted ${MULTI_STAFF ? "ml-2" : ""}`}>
                        {MULTI_STAFF ? label : hoursLabel(ranges, label)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="grid" style={{ gridTemplateColumns: gridColumns }}>
                <div className="relative" style={{ height: grid.height }}>
                  {grid.rows.map((m) =>
                    m % 60 === 0 ? (
                      <div
                        key={m}
                        className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-fg-muted"
                        style={{ top: top(grid, m) }}
                      >
                        {fmt(m)}
                      </div>
                    ) : null,
                  )}
                </div>

                {staffMembers.map((m) => {
                  const { ranges } = workRangesFor(m.key, date, schedules, overrides);
                  const myBookings = activeBookings.filter((b) => b.staffKey === m.key);
                  const myBlocks = blocks.filter((b) => b.staffKey === m.key);
                  const first = ranges[0];
                  const last = ranges[ranges.length - 1];
                  return (
                    <div key={m.key} className="relative border-l border-line" style={{ height: grid.height }}>
                      {/* van radnog vremena */}
                      {first === undefined || last === undefined ? (
                        <div className="absolute inset-0 bg-cream-deep" aria-hidden="true" />
                      ) : (
                        <>
                          <div
                            className="absolute inset-x-0 top-0 bg-cream-deep"
                            style={{ height: Math.max(0, top(grid, Math.max(grid.start, first.startMin))) }}
                            aria-hidden="true"
                          />
                          {ranges.slice(1).map((r, i) => (
                            <div
                              key={i}
                              className="absolute inset-x-0 bg-cream-deep"
                              style={{ top: top(grid, ranges[i].endMin), height: Math.max(0, top(grid, r.startMin) - top(grid, ranges[i].endMin)) }}
                              aria-hidden="true"
                            />
                          ))}
                          <div
                            className="absolute inset-x-0 bottom-0 bg-cream-deep"
                            style={{ height: Math.max(0, top(grid, grid.end) - top(grid, Math.min(grid.end, last.endMin))) }}
                            aria-hidden="true"
                          />
                        </>
                      )}

                      {/* ćelije */}
                      {grid.rows.map((start) => (
                        <button
                          key={start}
                          type="button"
                          aria-label={`${MULTI_STAFF ? `${m.name} ` : ""}${fmt(start)} — ${t.calendar.cellActions}`}
                          onClick={() => setSheet({ kind: "cell", staffKey: m.key, startMin: start })}
                          className={`absolute inset-x-0 border-t transition-colors hover:bg-sage/15 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus ${
                            start % 60 === 0 ? "border-line" : "border-line/50"
                          }`}
                          style={{ top: top(grid, start), height: ROW_PX }}
                        />
                      ))}

                      {/* pauze */}
                      {myBlocks.map((b) => (
                        <GridItem
                          key={b._id}
                          box={blockBox(grid, b.startMin, b.endMin)}
                          z="z-[2]"
                          visualClass="overflow-hidden rounded-lg border border-sand bg-[repeating-linear-gradient(45deg,#d9c9b0_0_4px,#f4efe6_4px_8px)] px-2 text-left text-xs text-fg"
                          onClick={() => setSheet({ kind: "blockInfo", block: b })}
                        >
                          <span className="font-medium">{t.calendar.block}</span>
                          {b.reason ? ` · ${b.reason}` : ""}
                        </GridItem>
                      ))}

                      {/* termini */}
                      {myBookings.map((b) => {
                        const confirmed = b.status === "potvrdjen";
                        return (
                          <GridItem
                            key={b._id}
                            box={blockBox(grid, b.startMin, b.endMin)}
                            z="z-[3]"
                            visualClass={`overflow-hidden rounded-lg px-2 py-1 text-left text-xs leading-tight ${
                              confirmed
                                ? "bg-accent text-accent-fg shadow-[0_12px_28px_-16px_rgba(0,0,0,0.5)]"
                                : "border-2 border-accent bg-bg-elev text-fg"
                            }`}
                            onClick={() => setSheet({ kind: "booking", booking: b })}
                          >
                            <span className="block truncate font-semibold">{b.name}</span>
                            <span className="block truncate">{b.serviceTitle}</span>
                            <span className="block tabular-nums opacity-80">{fmtRange(b.startMin, b.endMin)}</span>
                          </GridItem>
                        );
                      })}

                      {/* linija „sada" */}
                      {date === today && now.minutes >= grid.start && now.minutes <= grid.end ? (
                        <div
                          className="pointer-events-none absolute inset-x-0 z-[4] h-px bg-cognac"
                          style={{ top: top(grid, now.minutes) }}
                          aria-hidden="true"
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      <AnimatePresence>
        {sheet ? (
          <Modal key="sheet" title={sheetTitle(sheet)} onClose={close} focusKey={sheet.kind}>
            {sheet.kind === "cell" ? (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className={`${primaryButtonClass} w-full`}
                  onClick={() => setSheet({ kind: "manual", staffKey: sheet.staffKey, startMin: sheet.startMin })}
                >
                  {t.calendar.addBooking}
                </button>
                <button
                  type="button"
                  className={`${ghostButtonClass} w-full`}
                  onClick={() => setSheet({ kind: "block", staffKey: sheet.staffKey, startMin: sheet.startMin })}
                >
                  {t.calendar.addBlock}
                </button>
              </div>
            ) : null}
            {sheet.kind === "manual" ? (
              <ManualForm adminKey={adminKey} staffKey={sheet.staffKey} startMin={sheet.startMin} date={date} onDone={close} />
            ) : null}
            {sheet.kind === "block" ? (
              <BlockForm adminKey={adminKey} staffKey={sheet.staffKey} startMin={sheet.startMin} date={date} onDone={close} />
            ) : null}
            {sheet.kind === "booking" ? <BookingActions adminKey={adminKey} booking={sheet.booking} onDone={close} /> : null}
            {sheet.kind === "blockInfo" ? <BlockInfo adminKey={adminKey} block={sheet.block} onDone={close} /> : null}
          </Modal>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
