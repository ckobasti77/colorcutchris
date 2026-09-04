// @vitest-environment edge-runtime
/// <reference types="vite/client" />
/**
 * Backend testovi (convex-test, u memoriji): dvostruko zakazivanje, neradni dani,
 * honeypot, rate limit, tranzicije statusa, isticanje, admin ključ, usluge.
 * Datumi se računaju od realnog „danas" (Europe/Belgrade) jer `bookings.request`
 * čita Date.now() — biramo prvi utorak posle sutra da uvek bude u horizontu.
 */
import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { ADMIN_MESSAGES } from "./lib/admin";
import { MESSAGES } from "./lib/validate";
import { addDays, belgradeNow, toMin, weekdayOf } from "../lib/slots";

const modules = import.meta.glob("./**/*.ts");

const KEY = "test-admin-key";
const NOW = () => Date.now();

/** Prvi dan posle sutra sa zadatim danom u nedelji (0 = nedelja). */
function nextWeekday(weekday: number, minOffset = 2): string {
  let d = addDays(belgradeNow().date, minOffset);
  for (let i = 0; i < 7; i++) {
    if (weekdayOf(d) === weekday) return d;
    d = addDays(d, 1);
  }
  return d;
}

const TUESDAY = nextWeekday(2);
const SUNDAY = nextWeekday(0);
const MONDAY = nextWeekday(1);

const base = {
  name: "Test Gost",
  phone: "060 000 0000",
  serviceKey: "zensko-sisanje",
  staffKey: "any" as const,
  date: TUESDAY,
  startMin: toMin("10:00"),
};

function setup() {
  process.env.ADMIN_KEY = KEY;
  return convexTest(schema, modules);
}

describe("bookings.request", () => {
  it("upisuje zahtev na čekanju i zauzima slot", async () => {
    const t = setup();
    const before = await t.query(api.availability.day, { date: TUESDAY, serviceKey: base.serviceKey, now: NOW() });
    expect(before[0].slots).toContain(toMin("10:00"));

    const res = await t.mutation(api.bookings.request, base);
    expect(res.id).not.toBeNull();
    expect(res.staffKey).toBe("chris");
    expect(res.endMin).toBe(toMin("11:00"));

    const pending = await t.query(api.bookings.listPending, { key: KEY });
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({ name: "Test Gost", phone: "0600000000", status: "nov", source: "web", serviceTitle: "Žensko šišanje" });

    const after = await t.query(api.availability.day, { date: TUESDAY, serviceKey: base.serviceKey, now: NOW() });
    // 10:00–11:00 zauzeto: nestaju počeci 09:30, 10:00, 10:30 (usluga od 60 min)
    expect(after[0].slots).not.toContain(toMin("10:00"));
    expect(after[0].slots).not.toContain(toMin("09:30"));
    expect(after[0].slots).not.toContain(toMin("10:30"));
    expect(after[0].slots).toContain(toMin("11:00"));
    expect(after[0].slots).toContain(toMin("09:00"));
    await t.finishInProgressScheduledFunctions();
  });

  it("isti slot dva puta → „termin je upravo zauzet”", async () => {
    const t = setup();
    await t.mutation(api.bookings.request, base);
    await expect(t.mutation(api.bookings.request, { ...base, phone: "061 111 1111" })).rejects.toThrow(MESSAGES.taken);
    await t.finishInProgressScheduledFunctions();
  });

  it("neradni dani (nedelja, ponedeljak) se odbijaju, ali izuzetak ih otvara", async () => {
    const t = setup();
    await expect(t.mutation(api.bookings.request, { ...base, date: SUNDAY })).rejects.toThrow(MESSAGES.closed);
    await expect(t.mutation(api.bookings.request, { ...base, date: MONDAY })).rejects.toThrow(MESSAGES.closed);

    await t.mutation(api.schedules.upsertOverride, {
      key: KEY,
      staffKey: "chris",
      date: SUNDAY,
      kind: "custom",
      startMin: toMin("10:00"),
      endMin: toMin("17:00"),
    });
    const week = await t.query(api.availability.week, { startDate: SUNDAY, serviceKey: base.serviceKey, now: NOW() });
    expect(week[0]).toMatchObject({ date: SUNDAY, open: true });
    expect(week[0].count).toBeGreaterThan(0);
    const res = await t.mutation(api.bookings.request, { ...base, date: SUNDAY, startMin: toMin("11:00") });
    expect(res.id).not.toBeNull();
    await t.finishInProgressScheduledFunctions();
  });

  it("honeypot vraća lažni uspeh bez upisa", async () => {
    const t = setup();
    const res = await t.mutation(api.bookings.request, { ...base, website: "http://spam.example" });
    expect(res.id).toBeNull();
    expect(await t.query(api.bookings.pendingCount, { key: KEY })).toBe(0);
  });

  it("validacija: ime, telefon, prošli datum, nepoznata usluga", async () => {
    const t = setup();
    await expect(t.mutation(api.bookings.request, { ...base, name: "A" })).rejects.toThrow(MESSAGES.name);
    await expect(t.mutation(api.bookings.request, { ...base, phone: "12" })).rejects.toThrow(MESSAGES.phone);
    await expect(t.mutation(api.bookings.request, { ...base, date: "2020-01-07" })).rejects.toThrow(MESSAGES.datePast);
    await expect(t.mutation(api.bookings.request, { ...base, date: "2020-13-45" })).rejects.toThrow(MESSAGES.dateFormat);
    await expect(t.mutation(api.bookings.request, { ...base, serviceKey: "nepostoji" })).rejects.toThrow(MESSAGES.service);
  });

  it("rate limit: najviše 3 zahteva na sat po telefonu", async () => {
    const t = setup();
    await t.mutation(api.bookings.request, { ...base, startMin: toMin("09:00") });
    await t.mutation(api.bookings.request, { ...base, startMin: toMin("11:00") });
    await t.mutation(api.bookings.request, { ...base, startMin: toMin("13:00") });
    await expect(t.mutation(api.bookings.request, { ...base, startMin: toMin("15:00") })).rejects.toThrow(MESSAGES.rateLimit);
    await t.finishInProgressScheduledFunctions();
  });

  it("sakrivena usluga se ne nudi i ne prima zahteve", async () => {
    const t = setup();
    await t.mutation(api.services.setHidden, { key: KEY, serviceKey: base.serviceKey, hidden: true });
    const overrides = await t.query(api.services.overrides, {});
    expect(overrides).toEqual([{ serviceKey: base.serviceKey, hidden: true }]);
    expect(await t.query(api.availability.day, { date: TUESDAY, serviceKey: base.serviceKey, now: NOW() })).toEqual([]);
    await expect(t.mutation(api.bookings.request, base)).rejects.toThrow(MESSAGES.service);
    // admin i dalje može ručno
    const id = await t.mutation(api.bookings.createManual, { key: KEY, name: "Ručno", serviceKey: base.serviceKey, staffKey: "chris", date: TUESDAY, startMin: toMin("10:00") });
    expect(id).toBeTruthy();
  });
});

describe("admin", () => {
  let t: ReturnType<typeof convexTest>;
  beforeEach(() => {
    t = setup();
  });

  it("pogrešan ključ se odbija svuda", async () => {
    await expect(t.query(api.bookings.listPending, { key: "pogresan" })).rejects.toThrow(ADMIN_MESSAGES.badKey);
    await expect(t.mutation(api.admin.init, { key: "" })).rejects.toThrow(ADMIN_MESSAGES.badKey);
    await expect(t.query(api.settings.get, { key: "x" })).rejects.toThrow(ADMIN_MESSAGES.badKey);
  });

  it("init je idempotentan i seed-uje podrazumevano radno vreme", async () => {
    const first = await t.mutation(api.admin.init, { key: KEY });
    expect(first).toEqual({ seededStaff: true, seededSchedules: true, seededSettings: true });
    const second = await t.mutation(api.admin.init, { key: KEY });
    expect(second).toEqual({ seededStaff: false, seededSchedules: false, seededSettings: false });
    const weekly = await t.query(api.schedules.listWeekly, { key: KEY });
    // uto–pet + sub = 5 redova; ned i pon bez redova
    expect(weekly).toHaveLength(5);
    expect(weekly.find((r) => r.weekday === 6)).toMatchObject({ startMin: toMin("10:00"), endMin: toMin("17:00") });
    expect(weekly.some((r) => r.weekday === 0 || r.weekday === 1)).toBe(false);
    const status = await t.query(api.admin.status, { key: KEY });
    expect(status).toEqual({ seeded: true, hoursConfirmed: false });
    // „Potvrdi radno vreme" bez izmena skida baner
    await t.mutation(api.settings.confirmHours, { key: KEY });
    expect((await t.query(api.admin.status, { key: KEY })).hoursConfirmed).toBe(true);
  });

  it("čuvanje radnog vremena potvrđuje sate; slobodan dan uklanja termine", async () => {
    await t.mutation(api.admin.init, { key: KEY });
    await t.mutation(api.schedules.set, { key: KEY, staffKey: "chris", weekday: 2, ranges: [{ startMin: toMin("12:00"), endMin: toMin("16:00") }] });
    expect((await t.query(api.admin.status, { key: KEY })).hoursConfirmed).toBe(true);
    const day = await t.query(api.availability.day, { date: TUESDAY, serviceKey: "siske", now: NOW() });
    expect(day[0].slots[0]).toBe(toMin("12:00"));
    expect(day[0].slots[day[0].slots.length - 1]).toBe(toMin("15:30")); // šiške 15 min, korak 30
    await t.mutation(api.schedules.upsertOverride, { key: KEY, staffKey: "chris", date: TUESDAY, kind: "off" });
    expect((await t.query(api.availability.day, { date: TUESDAY, serviceKey: "siske", now: NOW() }))[0].slots).toEqual([]);
    await expect(t.mutation(api.schedules.set, { key: KEY, staffKey: "chris", weekday: 2, ranges: [{ startMin: 600, endMin: 500 }] })).rejects.toThrow(MESSAGES.range);
  });

  it("tranzicije statusa: nov → potvrdjen → otkazan; ostalo zabranjeno", async () => {
    const { id } = await t.mutation(api.bookings.request, base);
    if (!id) throw new Error("no id");
    await expect(t.mutation(api.bookings.setStatus, { key: KEY, id, status: "nov" })).rejects.toThrow(MESSAGES.transition);
    await t.mutation(api.bookings.setStatus, { key: KEY, id, status: "potvrdjen" });
    await expect(t.mutation(api.bookings.setStatus, { key: KEY, id, status: "odbijen" })).rejects.toThrow(MESSAGES.transition);
    const range = await t.query(api.bookings.listRange, { key: KEY, from: TUESDAY, to: TUESDAY });
    expect(range[0]).toMatchObject({ status: "potvrdjen" });
    expect(range[0].decidedAt).toBeTypeOf("number");
    await t.mutation(api.bookings.setStatus, { key: KEY, id, status: "otkazan" });
    await expect(t.mutation(api.bookings.setStatus, { key: KEY, id, status: "potvrdjen" })).rejects.toThrow(MESSAGES.transition);
    // otkazan termin oslobađa slot
    const day = await t.query(api.availability.day, { date: TUESDAY, serviceKey: base.serviceKey, now: NOW() });
    expect(day[0].slots).toContain(toMin("10:00"));
    await t.finishInProgressScheduledFunctions();
  });

  it("ručni termin: van radnog vremena sme, preko termina ili pauze ne", async () => {
    await t.mutation(api.bookings.request, base); // 10:00–11:00
    await expect(
      t.mutation(api.bookings.createManual, { key: KEY, name: "Preklop", serviceKey: "siske", staffKey: "chris", date: TUESDAY, startMin: toMin("10:30") }),
    ).rejects.toThrow(MESSAGES.overlap);
    await t.mutation(api.blocks.add, { key: KEY, staffKey: "chris", date: TUESDAY, startMin: toMin("13:00"), endMin: toMin("14:00"), reason: "ručak" });
    await expect(
      t.mutation(api.bookings.createManual, { key: KEY, name: "Preklop", serviceKey: "feniranje", staffKey: "chris", date: TUESDAY, startMin: toMin("13:30") }),
    ).rejects.toThrow(MESSAGES.overlap);
    const id = await t.mutation(api.bookings.createManual, { key: KEY, name: "Rano", phone: "+381 60 123 4567", serviceKey: "siske", staffKey: "chris", date: TUESDAY, startMin: toMin("07:00") });
    const range = await t.query(api.bookings.listRange, { key: KEY, from: TUESDAY, to: TUESDAY });
    const manual = range.find((b) => b._id === id);
    expect(manual).toMatchObject({ status: "potvrdjen", source: "admin", phone: "+381601234567", durationMin: 15 });
    const blocks = await t.query(api.blocks.listDay, { key: KEY, date: TUESDAY });
    expect(blocks).toHaveLength(1);
    await t.mutation(api.blocks.remove, { key: KEY, id: blocks[0]._id });
    expect(await t.query(api.blocks.listDay, { key: KEY, date: TUESDAY })).toEqual([]);
    await t.finishInProgressScheduledFunctions();
  });

  it("expirePending otkazuje zahteve starije od holdHours", async () => {
    const oldId = await t.run(async (ctx) =>
      ctx.db.insert("bookings", {
        name: "Stari",
        phone: "0600000001",
        serviceKey: "siske",
        serviceTitle: "Šiške",
        durationMin: 15,
        staffKey: "chris",
        date: TUESDAY,
        startMin: toMin("09:00"),
        endMin: toMin("09:15"),
        note: "napomena",
        status: "nov",
        createdAt: Date.now() - 49 * 60 * 60 * 1000,
        source: "web",
      }),
    );
    await t.mutation(api.bookings.request, { ...base, startMin: toMin("11:00") }); // svež zahtev ostaje
    const n = await t.mutation(internal.bookings.expirePending, {});
    expect(n).toBe(1);
    const old = await t.run(async (ctx) => ctx.db.get("bookings", oldId));
    expect(old).toMatchObject({ status: "otkazan", note: "napomena · isteklo" });
    expect(await t.query(api.bookings.pendingCount, { key: KEY })).toBe(1);
    await t.finishInProgressScheduledFunctions();
  });

  it("usluge: trajanje, cena i vraćanje na podrazumevano briše red", async () => {
    await t.mutation(api.services.setDuration, { key: KEY, serviceKey: "feniranje", durationMin: 60 });
    await t.mutation(api.services.setPrice, { key: KEY, serviceKey: "feniranje", priceFrom: 1500 });
    expect(await t.query(api.services.overrides, {})).toEqual([{ serviceKey: "feniranje", durationMin: 60, priceFrom: 1500 }]);
    await t.mutation(api.services.setDuration, { key: KEY, serviceKey: "feniranje", durationMin: 45 });
    expect(await t.query(api.services.overrides, {})).toEqual([{ serviceKey: "feniranje", priceFrom: 1500 }]);
    await t.mutation(api.services.setPrice, { key: KEY, serviceKey: "feniranje", priceFrom: null });
    expect(await t.query(api.services.overrides, {})).toEqual([]);
    await expect(t.mutation(api.services.setDuration, { key: KEY, serviceKey: "feniranje", durationMin: 3 })).rejects.toThrow(MESSAGES.range);
    await expect(t.mutation(api.services.setPrice, { key: KEY, serviceKey: "feniranje", priceFrom: -5 })).rejects.toThrow(MESSAGES.price);
    await expect(t.mutation(api.services.setPrice, { key: KEY, serviceKey: "nema", priceFrom: 5 })).rejects.toThrow(MESSAGES.service);
  });

  it("podešavanja: granice i uticaj na termine", async () => {
    await expect(t.mutation(api.settings.update, { key: KEY, slotStepMin: 3 })).rejects.toThrow(MESSAGES.range);
    await expect(t.mutation(api.settings.update, { key: KEY, holdHours: 721 })).rejects.toThrow(MESSAGES.range);
    await t.mutation(api.settings.update, { key: KEY, slotStepMin: 60, horizonDays: 3 });
    const s = await t.query(api.settings.get, { key: KEY });
    expect(s).toMatchObject({ slotStepMin: 60, horizonDays: 3, leadTimeMin: 120, holdHours: 48, hoursConfirmed: false });
    // javna verzija (bez ključa) daje samo brojke za birač termina
    expect(await t.query(api.settings.publicInfo, {})).toEqual({ slotStepMin: 60, leadTimeMin: 120, horizonDays: 3, holdHours: 48 });
    const far = addDays(belgradeNow().date, 10);
    await expect(t.mutation(api.bookings.request, { ...base, date: far })).rejects.toThrow(MESSAGES.horizon);
  });

  it("purgeByPhone briše test zahteve", async () => {
    await t.mutation(api.bookings.request, base);
    expect(await t.mutation(internal.bookings.purgeByPhone, { phone: "060 000 0000" })).toBe(1);
    expect(await t.query(api.bookings.pendingCount, { key: KEY })).toBe(0);
    await t.finishInProgressScheduledFunctions();
  });
});
