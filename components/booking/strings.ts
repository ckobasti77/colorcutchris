/**
 * Svi tekstovi zakazivanja i admin panela — srpski, latinica, ti-forma,
 * u Kristijanovom glasu (kratke rečenice, prvo lice). Vidi docs/BRAND.md → Ton.
 */
import { MESSAGES } from "@/convex/lib/validate";
import { site } from "@/lib/site";

/* ------------------------------------------------------------------ */
/*  Javni deo — sekcija „Zakazivanje" i wizard                          */
/* ------------------------------------------------------------------ */

export const booking = {
  section: {
    eyebrow: "Zakazivanje",
    /** Naslov sekcije: „Izaberi termin. Ja se javim." — drugi deo je kurziv. */
    titleLead: "Izaberi termin.",
    titleItalic: "Ja se javim.",
    lead: "Usluga, dan, vreme — tri koraka. Zahtev stiže meni na telefon i potvrdim ga porukom ili pozivom. Bez plaćanja unapred, bez naloga.",
    orCall: "Radije bi da pričamo?",
    hoursNote: "Ako ti treba nešto hitno ili termin van ponuđenih — pozovi.",
    viber: "Piši na Viber",
    loading: "Učitavam zakazivanje…",
  },
  steps: ["Usluga", "Dan i vreme", "Podaci"] as const,
  stepOf: (i: number, n: number) => `Korak ${i} od ${n}`,
  nav: { back: "Nazad", next: "Dalje" },
  service: {
    title: "Šta radimo?",
    hint: "Ne znaš tačno šta ti treba? Izaberi najbliže — detalje dogovaramo uživo.",
    staffLabel: "Ko radi?",
    staffAny: "Svejedno",
    minutes: (n: number) => `${n} min`,
    priceFrom: (p: string) => `od ${p} din`,
    required: "Izaberi uslugu da nastaviš.",
  },
  day: {
    title: "Kad ti odgovara?",
    thisWeek: "ove nedelje",
    prevWeek: "Prethodna nedelja",
    nextWeek: "Sledeća nedelja",
    weekStrip: "Izbor dana",
    today: "danas",
    closed: "zatvoreno",
    past: "prošlo",
    beyond: "predaleko unapred",
    noSlots: "nema termina",
    loading: "Učitavam slobodne termine…",
    empty: "Tog dana nema slobodnih termina. Probaj drugi dan ili me pozovi.",
    prepodne: "Prepodne",
    popodne: "Popodne",
    slotsLabel: "Slobodni termini",
    ends: (range: string) => `Termin: ${range}`,
    withStaff: (name: string) => `kod ${name}`,
    pickHint: "Izaberi dan i vreme da nastaviš.",
    pickTime: "Izaberi vreme da nastaviš.",
  },
  details: {
    title: "Ko dolazi?",
    name: "Ime i prezime",
    namePlaceholder: "npr. Jelena Petrović",
    phone: "Telefon",
    phonePlaceholder: "060 123 4567",
    note: "Napomena (nije obavezno)",
    notePlaceholder: "Dužina, trenutna boja, inspo, posebne želje…",
    /** Honeypot polje — nevidljivo ljudima, tekst je samo za DOM. */
    website: "Veb sajt",
    noteCount: (n: number, max: number) => `${n}/${max}`,
    submit: "Pošalji zahtev",
    submitting: "Šaljem…",
    privacy: "Podatke koristim samo da potvrdim termin. Termin nije potvrđen dok ti se ne javim.",
  },
  summary: {
    title: "Tvoj termin",
    service: "Usluga",
    staff: "Frizer",
    date: "Dan",
    time: "Vreme",
    duration: "Trajanje",
    price: "Cena",
    empty: "Izaberi uslugu — ovde ćeš videti detalje termina.",
    staffAny: "Svejedno",
    priceNote: "konačna cena zavisi od dužine i gustine kose",
  },
  success: {
    title: "Zahtev je poslat.",
    text: (holdHours: number) =>
      `Chris potvrđuje termin porukom ili pozivom na ${site.phone.display}. Termin je rezervisan do potvrde (${holdHours} h).`,
    quickTitle: "Hoćeš odmah da mi pišeš?",
    viber: "Viber",
    call: "Poziv",
    reset: "Novi zahtev",
    message: (parts: { service: string; date: string; time: string; name: string }) =>
      `Zdravo! Poslao/la sam zahtev preko sajta: ${parts.service}, ${parts.date} u ${parts.time}. ${parts.name}`,
  },
  errors: {
    required: "Ovo polje je obavezno.",
    name: MESSAGES.name,
    phone: MESSAGES.phone,
    note: MESSAGES.note,
    /** Isti string kao na serveru — wizard po njemu prepoznaje „vrati se na izbor termina". */
    taken: MESSAGES.taken,
    generic: "Nešto je krenulo naopako. Probaj ponovo ili me pozovi.",
    noBackend: "Onlajn zakazivanje trenutno nije dostupno.",
    serviceHidden: "Ta usluga trenutno nije dostupna za zakazivanje — izaberi drugu.",
    title: "Zahtev nije poslat",
    hint: "Pozovi ili piši na Viber:",
    callUs: "Pozovi",
    viber: "Viber",
  },
} as const;

/* ------------------------------------------------------------------ */
/*  Admin panel                                                        */
/* ------------------------------------------------------------------ */

export const statusOptions = [
  { value: "nov", label: "Na čekanju" },
  { value: "potvrdjen", label: "Potvrđen" },
  { value: "otkazan", label: "Otkazan" },
  { value: "odbijen", label: "Odbijen" },
] as const;
export type Status = (typeof statusOptions)[number]["value"];

export function statusLabel(status: Status): string {
  return statusOptions.find((o) => o.value === status)?.label ?? status;
}

/** YYYY-MM-DD → dd.MM.yyyy */
export function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
}

export const admin = {
  title: `Panel — ${site.name}`,
  heading: "Panel",
  subheading: site.name,
  keyLabel: "Ključ",
  keyPlaceholder: "Upiši admin ključ",
  keyHint: "Ključ ti je dao Jovan. Čuva se samo u ovom prozoru.",
  keySubmit: "Otvori panel",
  keyClear: "Promeni ključ",
  badKey: "Neispravan ključ",
  loading: "Učitavam…",
  saving: "Čuvam…",
  saved: "Sačuvano ✓",
  error: "Greška",
  retry: "Pokušaj ponovo",
  close: "Zatvori",
  cancel: "Odustani",
  save: "Sačuvaj",
  remove: "Ukloni",
  tabs: {
    requests: "Zahtevi",
    calendar: "Kalendar",
    hours: "Radno vreme",
    services: "Usluge",
  },
  banner: {
    title: "Podesi radno vreme",
    text: "Trenutno važi podrazumevano: uto–pet 09:00–19:00, sub 10:00–17:00, ned i pon zatvoreno. Proveri i izmeni u kartici „Radno vreme“ — tek onda gosti vide prave termine.",
    go: "Otvori radno vreme",
    init: "Inicijalizuj",
  },
  requests: {
    empty: "Nema novih zahteva. Svi termini su u kalendaru.",
    emptyHint: "Kad neko zakaže preko sajta, zahtev se pojavi ovde — odmah, bez osvežavanja.",
    count: (n: number) => (n === 1 ? "1 zahtev na čekanju" : n >= 2 && n <= 4 ? `${n} zahteva na čekanju` : `${n} zahteva na čekanju`),
    confirm: "Potvrdi",
    decline: "Odbij",
    received: "primljeno",
    note: "Napomena",
    source: { web: "sajt", admin: "ručno" },
  },
  calendar: {
    today: "Danas",
    prev: "Prethodni dan",
    next: "Sledeći dan",
    date: "Datum",
    closed: "neradni dan",
    off: "slobodan dan",
    custom: "posebno radno vreme",
    pending: "Na čekanju",
    confirmed: "Potvrđen",
    block: "pauza",
    legend: { confirmed: "Potvrđen", pending: "Na čekanju", block: "Pauza", closed: "Van radnog vremena" },
    cellActions: "Radnje",
    addBooking: "Dodaj termin",
    addBlock: "Blokiraj",
    confirm: "Potvrdi",
    decline: "Odbij",
    cancel: "Otkaži termin",
    removeBlock: "Ukloni pauzu",
    call: "Pozovi",
    workHours: "radno vreme",
    empty: "Ništa u kalendaru za ovaj dan. Klikni na vreme da dodaš termin ili pauzu.",
    manual: {
      title: "Dodaj termin (ručno)",
      name: "Ime i prezime",
      phone: "Telefon (nije obavezno)",
      service: "Usluga",
      staff: "Frizer",
      start: "Početak",
      duration: "Trajanje (min)",
      note: "Napomena",
      save: "Sačuvaj kao potvrđen",
    },
    blockForm: {
      title: "Blokiraj vreme",
      staff: "Frizer",
      from: "Od",
      to: "Do",
      reason: "Razlog (nije obavezno)",
      reasonPlaceholder: "pauza, ručak, privatno…",
      save: "Blokiraj",
    },
  },
  hours: {
    title: "Nedeljno radno vreme",
    intro: "Za svaki dan upiši jedan ili više opsega (npr. 09:00–13:00 i 15:00–19:00). Dan bez opsega je neradan.",
    dayOff: "Neradni dan",
    addRange: "+ Dodaj opseg",
    confirm: "Potvrdi radno vreme",
    confirmHint: "Ako ti ovo odgovara, samo potvrdi — baner nestaje, a gosti vide ove termine.",
    from: "od",
    to: "do",
    overridesTitle: "Izuzeci po datumu",
    overridesIntro: "Radiš u nedelju ili ponedeljak, uzimaš slobodan dan ili radiš drugačije nego obično — za konkretan datum. Izuzetak ima prednost nad nedeljnim rasporedom.",
    addWorkingSunday: "+ Radim u nedelju",
    addWorkingMonday: "+ Radim u ponedeljak",
    addDayOff: "+ Slobodan dan",
    addCustom: "+ Posebno vreme",
    noOverrides: "Nema izuzetaka u narednih 60 dana.",
    allStaff: "Svi frizeri",
    kindOff: "slobodan dan",
    kindCustom: "radi",
    note: "Napomena",
    settingsTitle: "Podešavanja termina",
    settingsIntro: "Korak je razmak između ponuđenih početaka. Najava je koliko unapred gost mora da zakaže. Zahtev koji ne potvrdiš u zadatom roku sam se otkazuje.",
    step: "Korak termina (min)",
    lead: "Najmanja najava (min)",
    horizon: "Koliko dana unapred",
    hold: "Zahtev ističe posle (sati)",
    saveSettings: "Sačuvaj podešavanja",
  },
  services: {
    title: "Usluge u zakazivanju",
    intro:
      "Trajanje određuje koje termine gosti vide. Cena „od“ se prikazuje uz uslugu — ostavi prazno dok je ne odrediš. Isključena usluga se ne nudi na sajtu, ali je i dalje možeš ručno upisati u kalendar.",
    service: "Usluga",
    duration: "Trajanje (min)",
    priceFrom: "Cena od (din)",
    pricePlaceholder: "—",
    visible: "Vidljivo u zakazivanju",
    hiddenBadge: "sakriveno",
    minutes: "min",
    din: "din",
    defaultOf: (n: number) => `podrazumevano ${n} min`,
    reset: "Vrati podrazumevano",
  },
} as const;
