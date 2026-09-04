/**
 * Podaci o salonu — jedno mesto za sve što se menja.
 * Izvori: Facebook stranica (Tosamjahair), Google Maps profil (Bojanska 24), Wanderlog agregat.
 * Označeno TODO = čeka potvrdu klijenta (vidi docs/BRAND.md → "Otvoreno").
 */

export const site = {
  name: "color cut Chris and more",
  shortName: "Chris",
  owner: "Kristijan Vlajković",
  /** Produkcioni URL (Vercel) — koristi ga OG metadata i link ka /admin u mejl obaveštenju. */
  url: "https://colorcutchris.vercel.app",
  city: "Beograd",
  phone: { display: "060 373 8001", href: "tel:+381603738001" },
  viber: "viber://chat?number=%2B381603738001",
  email: "vlajkovick@gmail.com",
  address: { street: "Bojanska 24", city: "11000 Beograd", area: "Zvezdara" },
  /** Google Maps: uto–pet 9–19, sub 10–17, ned–pon zatvoreno */
  hours: [
    { days: "Utorak – Petak", time: "09:00 – 19:00" },
    { days: "Subota", time: "10:00 – 17:00" },
    { days: "Nedelja i ponedeljak", time: "zatvoreno" },
  ],
  /**
   * Isto radno vreme kao podaci (indeks 0 = nedelja … 6 = subota). Izvor za
   * podrazumevani raspored u Convex-u (`convex/lib/availability.ts → DEFAULT_WEEK`);
   * važi dok Chris u admin panelu ne sačuva svoje. Držati u skladu sa `hours` iznad.
   */
  workWeek: [
    [], // nedelja — zatvoreno
    [], // ponedeljak — zatvoreno
    [{ start: "09:00", end: "19:00" }], // utorak
    [{ start: "09:00", end: "19:00" }], // sreda
    [{ start: "09:00", end: "19:00" }], // četvrtak
    [{ start: "09:00", end: "19:00" }], // petak
    [{ start: "10:00", end: "17:00" }], // subota
  ],
  google: { rating: 5.0, reviews: 24 },
  social: {
    facebook: "https://www.facebook.com/Tosamjahair/",
    instagram: "https://www.instagram.com/colorcutchrisandmore/",
  },
  mapsUrl: "https://www.google.com/maps/place/Color+cut+Chris+and+more/@44.7960207,20.4837926,17z/data=!4m6!3m5!1s0x475a714e6dfb773b:0xe21e251a1d031898!8m2!3d44.7960207!4d20.4837926",
  mapsEmbed:
    "https://www.google.com/maps?ll=44.7960207,20.4837926&z=16&t=m&output=embed&hl=sr-Latn",
} as const;

export type Service = {
  id: string;
  label: string; // kako stoji u brendu (engleski, kao na FB)
  title: string; // srpski naslov
  blurb: string;
  photo: string;
  alt: string;
};

export const services: Service[] = [
  {
    id: "color",
    label: "color",
    title: "Farbanje",
    blurb:
      "Balayage, air-touch, prekrivanje sedih, korekcije boje. Radim sa Goldwell paletom i biram nijansu koja živi sa tvojim tenom, ne protiv njega.",
    photo: "/photos/rad-plavi-balayage.webp",
    alt: "Svetli blond balayage u mekim talasima",
  },
  {
    id: "cut",
    label: "cut",
    title: "Šišanje",
    blurb:
      "Šišanje koje se ponaša i kad ga ne feniraš. Razgovor pre makaza je obavezan — pričamo o tome kako živiš sa kosom, pa tek onda sečemo.",
    photo: "/photos/rad-prirodna-smedja.webp",
    alt: "Prirodno smeđa kosa sa svetlim pramenovima i mekim talasima",
  },
  {
    id: "style",
    label: "style",
    title: "Styling",
    blurb:
      "Feniranje, talasi, glatko, podignuto. Za sastanak, slavlje ili samo zato što je četvrtak.",
    photo: "/photos/rad-styling-sisike.webp",
    alt: "Dugi talasi sa zavesastim šiškama",
  },
  {
    id: "bride",
    label: "bride",
    title: "Svečane frizure",
    blurb:
      "Venčanja, mature, proslave. Proba unapred, plan po satima za veliki dan i frizura koja traje duže od prve pesme.",
    photo: "/photos/rad-svecana-frizura.webp",
    alt: "Svečana frizura sa glamur talasima",
  },
];

/** Galerija radova — sve fotografije su sa javnog Google Maps profila salona (vlasnik: Kristijan Vlajković). */
export type Photo = { src: string; alt: string; w: number; h: number };
export const works: Photo[] = [
  { src: "/photos/rad-platinasti-talasi.webp", alt: "Platinasto plava duga kosa u talasima ispred tapete sa magnolijama", w: 1050, h: 1400 },
  { src: "/photos/rad-bakarna.webp", alt: "Duga bakarna kosa sa šiškama", w: 1050, h: 1400 },
  { src: "/photos/rad-tamni-balayage.webp", alt: "Tamna kosa sa mekim balayage prelazima", w: 1050, h: 1400 },
  { src: "/photos/rad-roze-blunt.webp", alt: "Pastelno roze kosa, ravno šišanje, ispred neon potpisa", w: 1050, h: 1400 },
  { src: "/photos/rad-topla-smedja.webp", alt: "Topla smeđa boja sa svetlijim krajevima", w: 787, h: 1400 },
  { src: "/photos/rad-pepeljasti-balayage.webp", alt: "Pepeljasto plavi balayage na dugoj kosi", w: 1050, h: 1400 },
  { src: "/photos/rad-bakarno-crvena.webp", alt: "Bakarno crvena boja, slojevito šišanje", w: 787, h: 1400 },
  { src: "/photos/rad-zlatno-plava.webp", alt: "Zlatno plava duga kosa", w: 1050, h: 1400 },
];

export const salonPhotos: Photo[] = [
  { src: "/photos/salon-radno-mesto.webp", alt: "Radno mesto: luk-ogledalo, sage niša sa proizvodima, konjak stolica", w: 1050, h: 1400 },
  { src: "/photos/salon-neon.webp", alt: "Neon potpis Chris iznad ratan komode", w: 1050, h: 1400 },
  { src: "/photos/salon-pult.webp", alt: "Pult i zelena kuhinja sa mesinganim lusterom", w: 1050, h: 1400 },
];

/**
 * Google recenzije (javne, sa Maps profila). Svih 6 ima pravu profilnu sliku;
 * `url` je Google-ov share link koji vodi tačno na tu recenziju.
 */
export type Review = { name: string; text: string; avatar: string; url: string; original?: "en" | "de" };
export const reviews: Review[] = [
  {
    name: "S. Djurdjevic",
    text: "Osim što će se o vašoj kosi brinuti majstor svog zanata Kristijan, bićete dočekani u salonu koji je prelep i prijatan i u kom ćete se osećati dobrodošlo. Hvala Kris!",
    avatar: "/reviews/s-djurdjevic.webp",
    url: "https://maps.app.goo.gl/TKAfWmnqSGKwEFWU8",
  },
  {
    name: "rabeb hammami",
    text: "Rekla sam Chrisu samo: „Uradi šta misliš da bi mi najbolje stajalo“ — za balayage i šišanje. Rezultat je bio lepši nego što sam mogla da zamislim.",
    avatar: "/reviews/rabeb-hammami.webp",
    url: "https://maps.app.goo.gl/Yk4zF7woEveME6tF8",
    original: "en",
  },
  {
    name: "Milica Savic",
    text: "Najbolji frizer na svetu! Šta poželiš, to i dobiješ!",
    avatar: "/reviews/milica-savic.webp",
    url: "https://maps.app.goo.gl/RqPh3U2zLHD2gF9C8",
  },
  {
    name: "Marija Skukovac",
    text: "Stručno osoblje i predivna atmosfera. Sve pohvale za najboljeg frizera.",
    avatar: "/reviews/marija-skukovac.webp",
    url: "https://maps.app.goo.gl/waLN75iVW98JHQtq8",
  },
  {
    name: "Souha Adib",
    text: "Preporuka za šišanje. Lepo je i čisto, a ceo proces — pranje, šišanje i feniranje — prošao je brzo. Salon ima prijatnu atmosferu.",
    avatar: "/reviews/souha-adib.webp",
    url: "https://maps.app.goo.gl/bMcpkAU4J6QzTvAB6",
    original: "en",
  },
  {
    name: "Nataša Đorđević",
    text: "Najbolji frizerski salon u Beogradu!",
    avatar: "/reviews/natasa-djordjevic.webp",
    url: "https://maps.app.goo.gl/kQWGaGe7BdaTXhE56",
  },
];

/** Link za ostavljanje nove recenzije (Google "write a review" za ovaj place id). */
export const writeReviewUrl =
  "https://search.google.com/local/writereview?placeid=ChIJO3f7bU5xWkcRmBgDHRolHuI";

/**
 * Kristijanov tekst o konsultaciji — objavljen kao karusel na FB/IG.
 * Prenet doslovno (samo mala slova umesto verzala). Redosled = redosled slajdova.
 */
export const manifesto = [
  { q: "„Zašto moja kosa ne izgleda kao na slici?“", a: "Zato što — nije ista kosa." },
  {
    a: "Drugačija prirodna baza. Drugačija gustina. Drugačija istorija farbanja. Drugačiji kvalitet kose. Nekad i godine bojenja iza nas. Sve to menja rezultat.",
  },
  {
    a: "A onda imamo i Instagram. Drugo svetlo. Drugi ugao. Obrada. Ista kosa na tri fotografije može izgledati kao tri različite boje.",
  },
  {
    a: "Zato mene kod tvoje inspo slike manje zanima: „kako da napravim identično?“ Više me zanima: „šta ti se ovde zapravo dopada?“",
  },
  {
    a: "Koliko je svetla? Ton? Pramenovi oko lica? Kontrast? Koliko je prirodna? E tu već možemo da pričamo o tvojoj kosi.",
  },
  {
    a: "Jer moj posao nije da ti napravim njenu kosu. Nego da ono što ti se kod nje dopada prevedem na tvoju.",
  },
  { a: "I ne kažem to da bih ti srušio očekivanja. Nego da bismo napravili najbolju verziju te ideje na tvojoj kosi." },
  { a: "Zato — donesi inspo. Obavezno. Samo hajde da je koristimo kao pravac, a ne obećanje." },
];

/** Cenovnik — TODO: zameniti pravim cenama sa "KARTE" iz salona. */
export const priceList: { group: string; items: { name: string; price: string; note?: string }[] }[] =
  [
    {
      group: "Šišanje",
      items: [
        { name: "Žensko šišanje", price: "—", note: "uključuje pranje i feniranje" },
        { name: "Muško šišanje", price: "—" },
        { name: "Šiške", price: "—" },
      ],
    },
    {
      group: "Farbanje",
      items: [
        { name: "Farbanje izrastka", price: "—" },
        { name: "Balayage / air-touch", price: "od —", note: "cena zavisi od dužine i gustine" },
        { name: "Toniranje", price: "—" },
      ],
    },
    {
      group: "Styling",
      items: [
        { name: "Feniranje", price: "—" },
        { name: "Svečana frizura", price: "od —" },
        { name: "Proba za venčanje", price: "—" },
      ],
    },
  ];
