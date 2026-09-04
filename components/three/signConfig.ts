/**
 * Tajming koreografije neona i plafoni svetla + tipovi imperativnog handle-a.
 *
 * Živi u zasebnom modulu BEZ three/R3F importa: Hero.tsx ga uvozi statički da od
 * njega sagradi `ignition` timeline, a 3D scena (NeonSign.tsx, ~950 KB sa three-om)
 * stiže tek kroz `next/dynamic`. Da je `SIGN` ostao u NeonSign.tsx, ceo three bi
 * završio u početnom bundle-u početne strane.
 */

export const SIGN = {
  /** Paljenje (dan → noć): tačno 2.400 s. */
  ignition: 2.4,
  /** Buđenje (noć → dan): cev se prosto ugasi, bez vraćanja trčanja svetla. */
  wake: 0.5,
  /** Ponovno paljenje iz pune noći: bez precrtavanja, samo gas i treperenje. */
  relight: 0.6,
  /** Gornja granica `power` vrednosti. */
  maxPower: 1,

  /** Trčanje svetla + rast gasa traju istih 1.70 s. */
  run: 1.7,
  /** Svetlo trči kroz luk: 0.00 → 0.75. */
  arcFill: { at: 0.0, duration: 0.75 },
  /** Svetlo trči kroz "Chris" — jedna cev, sa povratnim potezima: 0.25 → 1.70. */
  chrisFill: { at: 0.25, duration: 1.45 },
  /** Dokle gas stigne dok svetlo putuje. */
  runPower: 0.9,
  /** Štampana slova prelaze u krem oko t = 0.70. */
  textFlip: { at: 0.7, duration: 0.3 },
  /** Transformator "hvata": 5 koraka od 1.70 do 2.10. */
  flickerAt: 1.7,
  flickerStep: 0.08,
  flicker: [0.9, 0.15, 1, 0.45, 1],
  /** Drži puno svetlo — poslednji tween se završava tačno na 2.400 s. */
  hold: { at: 2.1, duration: 0.3 },
  /** Posle paljenja: beskrajno tiho pulsiranje (0.94 ↔ 1 od maxPower). */
  pulse: { to: 0.94, duration: 2.4 },

  /** Hint "skroluj — ugasi svetla" nestaje odmah. */
  hintFade: 0.3,
  /** Dnevni copy odlazi reč po reč: 0.30 → 1.20. */
  dayOut: { at: 0.3, duration: 0.5, staggerWindow: 0.4 },
  /** Noćni copy stiže reč po reč: 1.20 → 2.20. */
  nightIn: { at: 1.2, duration: 0.6, staggerWindow: 0.4 },

  /* --- plafoni svetla pri maxPower: pola od prvobitnih; pod nepromenjen --- */
  /** emissiveIntensity jezgra (bilo 2.55 → pola). */
  coreEmissive: { min: 0.15, max: 1.275 },
  /** uOpacity fresnel halo-a (bilo 0.88 → pola). */
  haloOpacity: { min: 0.03, max: 0.44 },
  /** opacity zidnog sjaja unutar diska (bilo 0.9 → × 0.45). */
  wallGlow: { max: 0.405 },
  /** opacity senke cevi na akrilu: dnevna → pri punoj snazi. */
  shadowOpacity: { min: 0.22, max: 0.32 },
} as const;

/**
 * Žive vrednosti koje GSAP tween-uje, a scena čita u useFrame.
 * Ništa animirano ne živi u React state-u — Hero ih vozi direktno.
 */
export type NeonLive = {
  /** 0..maxPower — intenzitet celog znaka (treperi zajedno). */
  power: { value: number };
  /** 0..1 — koliko je luk "iscrtan" svetlom (drawRange). */
  arc: { value: number };
  /** 0..1 — isto za "Chris" cev. */
  chris: { value: number };
  /** 0 = štampana slova u ink boji (dan), 1 = krem (noć). */
  tint: { value: number };
};

export type NeonSignHandle = {
  live: NeonLive;
  /** Tiho pulsiranje posle paljenja. */
  startPulse: () => void;
  stopPulse: () => void;
};
