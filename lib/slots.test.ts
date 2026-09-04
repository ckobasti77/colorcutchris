import { describe, expect, it } from "vitest";
import {
  addDays,
  belgradeNow,
  buildDaySlots,
  diffDays,
  fmt,
  fmtRange,
  groupByPartOfDay,
  isValidDate,
  minStartFor,
  normalizeRanges,
  startOfWeek,
  toMin,
  weekdayOf,
} from "./slots";

const STEP = 30;
const day = (start: string, end: string) => ({ startMin: toMin(start), endMin: toMin(end) });

describe("pomoćne funkcije za vreme", () => {
  it("toMin / fmt u oba smera", () => {
    expect(toMin("10:30")).toBe(630);
    expect(toMin("9:05")).toBe(545);
    expect(fmt(630)).toBe("10:30");
    expect(fmt(0)).toBe("00:00");
    expect(fmtRange(630, 705)).toBe("10:30–11:45");
    expect(() => toMin("25:00")).toThrow();
  });

  it("datumi ne zavise od vremenske zone", () => {
    expect(weekdayOf("2026-09-06")).toBe(0); // nedelja
    expect(weekdayOf("2026-09-03")).toBe(4); // četvrtak
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-03-29", 1)).toBe("2026-03-30"); // dan prelaska na letnje vreme u Beogradu
    expect(diffDays("2026-09-03", "2026-10-03")).toBe(30);
    expect(startOfWeek("2026-09-03")).toBe("2026-08-31");
    expect(startOfWeek("2026-09-06")).toBe("2026-08-31"); // nedelja pripada nedelji koja počinje ponedeljkom
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("2026-02-28")).toBe(true);
  });

  it("belgradeNow koristi Europe/Belgrade", () => {
    // 2026-09-03T22:30Z = 00:30 sledećeg dana u Beogradu (CEST, UTC+2)
    const n = belgradeNow(Date.parse("2026-09-03T22:30:00Z"));
    expect(n.date).toBe("2026-09-04");
    expect(n.minutes).toBe(30);
    expect(n.weekday).toBe(5);
    // Zima: 2026-12-01T23:30Z = 00:30 2. decembra (CET, UTC+1)
    const w = belgradeNow(Date.parse("2026-12-01T23:30:00Z"));
    expect(w.date).toBe("2026-12-02");
    expect(w.minutes).toBe(30);
  });

  it("normalizeRanges spaja opsege i izbacuje prazne", () => {
    expect(normalizeRanges([day("14:00", "20:00"), day("10:00", "14:00"), day("12:00", "12:00")])).toEqual([
      day("10:00", "20:00"),
    ]);
  });
});

describe("buildDaySlots", () => {
  it("staje u opseg: usluga od 60 min, 09:00–19:00", () => {
    const slots = buildDaySlots({ workRanges: [day("09:00", "19:00")], busyRanges: [], durationMin: 60, stepMin: STEP });
    expect(slots[0]).toBe(toMin("09:00"));
    expect(slots[slots.length - 1]).toBe(toMin("18:00")); // 18:00–19:00 staje, 18:30 ne
    expect(slots).toHaveLength(19);
  });

  it("usluga od 120 min pred kraj radnog vremena", () => {
    const slots = buildDaySlots({ workRanges: [day("10:00", "16:00")], busyRanges: [], durationMin: 120, stepMin: STEP });
    expect(slots.map(fmt)).toEqual(["10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00"]);
  });

  it("ivice: dodirivanje zauzetog opsega je dozvoljeno, presecanje nije", () => {
    const busy = [day("12:00", "13:00")];
    const slots = buildDaySlots({ workRanges: [day("10:00", "15:00")], busyRanges: busy, durationMin: 60, stepMin: STEP });
    const s = slots.map(fmt);
    expect(s).toContain("11:00"); // 11:00–12:00 dodiruje
    expect(s).not.toContain("11:30"); // 11:30–12:30 seče
    expect(s).not.toContain("12:00");
    expect(s).not.toContain("12:30"); // 12:30–13:30 seče
    expect(s).toContain("13:00"); // 13:00–14:00 dodiruje
  });

  it("pauza usred dana", () => {
    const slots = buildDaySlots({
      workRanges: [day("10:00", "20:00")],
      busyRanges: [day("13:00", "14:00")],
      durationMin: 90,
      stepMin: STEP,
    });
    const s = slots.map(fmt);
    expect(s).toContain("11:30"); // 11:30–13:00
    expect(s).not.toContain("12:00");
    expect(s).not.toContain("12:30");
    expect(s).not.toContain("13:00");
    expect(s).not.toContain("13:30");
    expect(s).toContain("14:00");
  });

  it("podeljena smena: termin ne sme da premosti pauzu", () => {
    const slots = buildDaySlots({
      workRanges: [day("09:00", "12:00"), day("15:00", "19:00")],
      busyRanges: [],
      durationMin: 60,
      stepMin: STEP,
    });
    const s = slots.map(fmt);
    expect(s).toContain("11:00");
    expect(s).not.toContain("11:30");
    expect(s).not.toContain("12:00");
    expect(s).not.toContain("14:30");
    expect(s).toContain("15:00");
    expect(s).toContain("18:00");
    expect(s).not.toContain("18:30");
  });

  it("najava: danas naspram sutra", () => {
    const now = { date: "2026-09-03", minutes: toMin("11:20") };
    const lead = 120;
    // Danas: najraniji početak je 13:20 → prvi termin na mreži je 13:30.
    const todayMin = minStartFor(now, "2026-09-03", lead);
    expect(todayMin).toBe(toMin("13:20"));
    const today = buildDaySlots({
      workRanges: [day("10:00", "20:00")],
      busyRanges: [],
      durationMin: 60,
      stepMin: STEP,
      minStartMin: todayMin ?? 0,
    });
    expect(fmt(today[0])).toBe("13:30");
    // Sutra: bez najave.
    const tomorrowMin = minStartFor(now, "2026-09-04", lead);
    expect(tomorrowMin).toBe(0);
    const tomorrow = buildDaySlots({
      workRanges: [day("10:00", "20:00")],
      busyRanges: [],
      durationMin: 60,
      stepMin: STEP,
      minStartMin: tomorrowMin ?? 0,
    });
    expect(fmt(tomorrow[0])).toBe("10:00");
    // Juče: ništa.
    expect(minStartFor(now, "2026-09-02", lead)).toBeNull();
  });

  it("izuzetak ima prednost nad nedeljnim rasporedom (pozivalac razrešava; motor samo koristi date opsege)", () => {
    const weekly = [day("10:00", "20:00")];
    const override = [day("12:00", "15:00")];
    const resolved = override.length > 0 ? override : weekly;
    const slots = buildDaySlots({ workRanges: resolved, busyRanges: [], durationMin: 60, stepMin: STEP });
    expect(slots.map(fmt)).toEqual(["12:00", "12:30", "13:00", "13:30", "14:00"]);
  });

  it("bez radnog vremena → nema termina; trajanje 0 → nema termina", () => {
    expect(buildDaySlots({ workRanges: [], busyRanges: [], durationMin: 60, stepMin: STEP })).toEqual([]);
    expect(buildDaySlots({ workRanges: [day("10:00", "20:00")], busyRanges: [], durationMin: 0, stepMin: STEP })).toEqual([]);
  });

  it("neparan početak se poravnava na mrežu", () => {
    const slots = buildDaySlots({ workRanges: [day("10:10", "12:00")], busyRanges: [], durationMin: 30, stepMin: STEP });
    expect(slots.map(fmt)).toEqual(["10:30", "11:00", "11:30"]);
  });

  it("deli dan na 14:00", () => {
    const g = groupByPartOfDay([toMin("10:00"), toMin("13:30"), toMin("14:00"), toMin("18:00")]);
    expect(g.prepodne.map(fmt)).toEqual(["10:00", "13:30"]);
    expect(g.popodne.map(fmt)).toEqual(["14:00", "18:00"]);
  });
});
