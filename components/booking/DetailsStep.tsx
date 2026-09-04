"use client";

import { motion, useReducedMotion } from "motion/react";
import { booking } from "./strings";
import { errorClass, inputClass, labelClass } from "./wizardStyles";

export const NOTE_MAX = 300;

export type DetailsValues = { name: string; phone: string; note: string; website: string };
export type DetailsField = "name" | "phone" | "note";
export type DetailsErrors = Partial<Record<DetailsField, string>>;

/** Isto pravilo kao na serveru (convex/lib/validate.ts): +381… ili 0… sa 7–11 cifara. */
export function isValidPhone(phone: string): boolean {
  return /^(\+381|0)\d{7,11}$/.test(phone.replace(/[\s/()-]/g, ""));
}

export function validateDetails(v: DetailsValues): DetailsErrors {
  const e: DetailsErrors = {};
  const name = v.name.trim();
  if (!name) e.name = booking.errors.required;
  else if (name.length < 2 || name.length > 60) e.name = booking.errors.name;
  if (!v.phone.trim()) e.phone = booking.errors.required;
  else if (!isValidPhone(v.phone)) e.phone = booking.errors.phone;
  if (v.note.length > NOTE_MAX) e.note = booking.errors.note;
  return e;
}

function ErrorText({ id, message }: { id: string; message?: string }) {
  const reduce = useReducedMotion() ?? false;
  if (!message) return null;
  return (
    <motion.p
      id={id}
      className={errorClass}
      initial={reduce ? false : { opacity: 0, y: -2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {message}
    </motion.p>
  );
}

type Props = {
  ids: { name: string; phone: string; note: string; website: string };
  values: DetailsValues;
  errors: DetailsErrors;
  touched: Partial<Record<DetailsField, boolean>>;
  disabled: boolean;
  onChange: <K extends keyof DetailsValues>(key: K, value: DetailsValues[K]) => void;
  onBlur: (field: DetailsField) => void;
};

/** Korak 3: ime, telefon, napomena. Greške se pokazuju tek posle blur-a (ili slanja). */
export function DetailsStep({ ids, values, errors, touched, disabled, onChange, onBlur }: Props) {
  const show = (f: DetailsField) => (touched[f] ? errors[f] : undefined);
  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-5">
      <legend className="sr-only">{booking.details.title}</legend>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={ids.name} className={labelClass}>
            {booking.details.name}
          </label>
          <input
            id={ids.name}
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={60}
            placeholder={booking.details.namePlaceholder}
            value={values.name}
            onChange={(e) => onChange("name", e.target.value)}
            onBlur={() => onBlur("name")}
            aria-invalid={Boolean(show("name"))}
            aria-describedby={show("name") ? `${ids.name}-err` : undefined}
            className={inputClass}
          />
          <ErrorText id={`${ids.name}-err`} message={show("name")} />
        </div>
        <div>
          <label htmlFor={ids.phone} className={labelClass}>
            {booking.details.phone}
          </label>
          <input
            id={ids.phone}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            placeholder={booking.details.phonePlaceholder}
            value={values.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            onBlur={() => onBlur("phone")}
            aria-invalid={Boolean(show("phone"))}
            aria-describedby={show("phone") ? `${ids.phone}-err` : undefined}
            className={`${inputClass} tabular-nums`}
          />
          <ErrorText id={`${ids.phone}-err`} message={show("phone")} />
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-4">
          <label htmlFor={ids.note} className="text-sm font-medium text-fg">
            {booking.details.note}
          </label>
          <span className="text-xs tabular-nums text-fg-muted" aria-hidden="true">
            {booking.details.noteCount(values.note.length, NOTE_MAX)}
          </span>
        </div>
        <textarea
          id={ids.note}
          name="note"
          rows={3}
          maxLength={NOTE_MAX}
          placeholder={booking.details.notePlaceholder}
          value={values.note}
          onChange={(e) => onChange("note", e.target.value)}
          onBlur={() => onBlur("note")}
          aria-invalid={Boolean(show("note"))}
          aria-describedby={show("note") ? `${ids.note}-err` : undefined}
          className={`${inputClass} h-auto min-h-24 resize-y py-3`}
        />
        <ErrorText id={`${ids.note}-err`} message={show("note")} />
      </div>

      {/* Honeypot — nevidljiv ljudima, primamljiv botovima */}
      <div className="absolute top-0 -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor={ids.website}>{booking.details.website}</label>
        <input
          id={ids.website}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(e) => onChange("website", e.target.value)}
        />
      </div>

      <p className="text-[13px] leading-relaxed text-fg-muted">{booking.details.privacy}</p>
    </fieldset>
  );
}
