/**
 * Usluge koje se zakazuju kroz sekciju „Zakazivanje" + frizeri.
 * Podrazumevana trajanja i cene; Chris ih menja u admin panelu (tabela
 * `serviceOverrides` ima prednost). Nova usluga = novi red ovde.
 *
 * Fajl je čist (bez importa) jer ga uvozi i Convex backend.
 */

export type StaffKey = "chris";

export const staffMembers = [{ key: "chris", name: "Chris", genitive: "Chrisa", order: 0 }] as const satisfies readonly {
  key: StaffKey;
  name: string;
  /** Genitiv za „kod {ime}" („kod Chrisa"). */
  genitive: string;
  order: number;
}[];

export function staffName(key: StaffKey | "any" | undefined | null): string {
  const found = staffMembers.find((m) => m.key === key);
  return found ? found.name : "Svejedno";
}

/** „kod Chrisa" — genitiv imena frizera. */
export function staffNameGenitive(key: StaffKey): string {
  const found = staffMembers.find((m) => m.key === key);
  return found ? found.genitive : staffName(key);
}

export const bookableGroups = ["Šišanje", "Farbanje", "Styling", "Svečano"] as const;
export type BookableGroup = (typeof bookableGroups)[number];

export type BookableService = {
  key: string;
  title: string;
  group: BookableGroup;
  /** Podrazumevano trajanje u minutima; admin može da ga promeni (serviceOverrides). */
  durationMin: number;
  /** Cena „od" u dinarima ili null (UI tada ne prikazuje cenu). */
  priceFrom: number | null;
  staff: readonly StaffKey[];
};

const CHRIS: readonly StaffKey[] = ["chris"];

/**
 * Predlog liste — Jovan i Chris menjaju trajanja/cene u admin panelu.
 * Sve cene su null dok Chris ne unese prave (karta iz salona).
 */
export const bookableServices: readonly BookableService[] = [
  { key: "zensko-sisanje", title: "Žensko šišanje", group: "Šišanje", durationMin: 60, priceFrom: null, staff: CHRIS },
  { key: "musko-sisanje", title: "Muško šišanje", group: "Šišanje", durationMin: 45, priceFrom: null, staff: CHRIS },
  { key: "siske", title: "Šiške", group: "Šišanje", durationMin: 15, priceFrom: null, staff: CHRIS },
  { key: "decje-sisanje", title: "Dečje šišanje", group: "Šišanje", durationMin: 30, priceFrom: null, staff: CHRIS },
  { key: "izrastak", title: "Farbanje izrastka", group: "Farbanje", durationMin: 90, priceFrom: null, staff: CHRIS },
  { key: "cela-duzina", title: "Farbanje cele dužine", group: "Farbanje", durationMin: 120, priceFrom: null, staff: CHRIS },
  { key: "balayage", title: "Balayage / air-touch", group: "Farbanje", durationMin: 240, priceFrom: null, staff: CHRIS },
  { key: "toniranje", title: "Toniranje / gloss", group: "Farbanje", durationMin: 60, priceFrom: null, staff: CHRIS },
  { key: "sede", title: "Prekrivanje sedih", group: "Farbanje", durationMin: 90, priceFrom: null, staff: CHRIS },
  { key: "feniranje", title: "Feniranje", group: "Styling", durationMin: 45, priceFrom: null, staff: CHRIS },
  { key: "talasi-glacanje", title: "Talasi / glačanje", group: "Styling", durationMin: 60, priceFrom: null, staff: CHRIS },
  { key: "tretman", title: "Tretman (keratin, rekonstrukcija)", group: "Styling", durationMin: 60, priceFrom: null, staff: CHRIS },
  { key: "svecana-frizura", title: "Svečana frizura", group: "Svečano", durationMin: 90, priceFrom: null, staff: CHRIS },
  { key: "proba-vencanje", title: "Proba za venčanje", group: "Svečano", durationMin: 60, priceFrom: null, staff: CHRIS },
  { key: "mladenka", title: "Mladenka na dan venčanja", group: "Svečano", durationMin: 120, priceFrom: null, staff: CHRIS },
];

export function findBookableService(key: string): BookableService | undefined {
  return bookableServices.find((s) => s.key === key);
}

/** 1700 → "1.700" (tačka kao hiljadarski separator, kao na cenovnicima kod nas). */
export function formatDin(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
