import { site } from "@/lib/site";

/**
 * Jedan izvor za sve kontakt linkove — kontakt-traka (dock + mobilna traka), nav,
 * Kontakt sekcija i footer čitaju odavde. Redosled u nizu = redosled prikaza.
 * Ikonice: components/ui/SocialIcons.tsx → `contactIcon(id)`.
 */
export type ContactLinkId = "instagram" | "facebook" | "viber" | "call" | "mail";

export type ContactLink = {
  id: ContactLinkId;
  /** Kratka vidljiva labela (tooltip u dock-u, natpis u mobilnoj traci). */
  label: string;
  /** Pun accessible name — link nema tekst, samo ikonicu. */
  ariaLabel: string;
  href: string;
  /** Otvara se u novom prozoru (`target="_blank" rel="noreferrer"`). */
  external: boolean;
};

export const contactLinks: readonly ContactLink[] = [
  {
    id: "instagram",
    label: "Instagram",
    ariaLabel: "Instagram salona — otvara se u novom prozoru",
    href: site.social.instagram,
    external: true,
  },
  {
    id: "facebook",
    label: "Facebook",
    ariaLabel: "Facebook salona — otvara se u novom prozoru",
    href: site.social.facebook,
    external: true,
  },
  {
    id: "viber",
    label: "Viber",
    ariaLabel: `Piši na Viber, ${site.phone.display}`,
    href: site.viber,
    external: false,
  },
  {
    id: "call",
    label: "Pozovi",
    ariaLabel: `Pozovi ${site.phone.display}`,
    href: site.phone.href,
    external: false,
  },
  {
    id: "mail",
    label: "Mejl",
    ariaLabel: "Pošalji mejl",
    href: `mailto:${site.email}`,
    external: false,
  },
];

/** Isti linkovi po id-u — za podskupove sa sopstvenim redosledom (npr. mobilna traka). */
export const contactLinkById = Object.fromEntries(
  contactLinks.map((link) => [link.id, link]),
) as Record<ContactLinkId, ContactLink>;

/**
 * CTA ka sekciji Zakazivanje. Običan `<a href="#zakazivanje">`: Lenis (`anchors: true`)
 * skroluje glatko, a pod prefers-reduced-motion / bez JS-a sidro radi nativno.
 */
export const bookingLink = {
  label: "Zakaži",
  ariaLabel: "Zakaži termin",
  href: "#zakazivanje",
} as const;
