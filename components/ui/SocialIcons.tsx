import type { ComponentType, SVGProps } from "react";
import { CalendarCheck, Mail, Phone } from "lucide-react";
import type { ContactLinkId } from "@/lib/contactLinks";

/**
 * Ikonice za kontakt linkove. Jedna debljina linije (1.75) za sve — lucide
 * podrazumeva 2, pa lucide ikonice umotavamo. Instagram i Facebook crtamo sami:
 * lucide 1.x više ne isporučuje brend ikonice.
 */
export const ICON_STROKE = 1.75;

export type IconProps = Pick<
  SVGProps<SVGSVGElement>,
  "className" | "strokeWidth" | "aria-hidden" | "focusable"
>;
export type ContactIcon = ComponentType<IconProps>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: ICON_STROKE,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: "false",
} as const;

/** Viber: oblačić sa repom dole-levo, slušalica i jedan talas. */
export function ViberIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4A8.5 6.75 0 0 0 6 15.5V20.5L9.8 17.3A8.5 6.75 0 0 0 12 17.5A8.5 6.75 0 0 0 20.5 10.75A8.5 6.75 0 0 0 12 4Z" />
      <path d="M9.81 6.95L11 8.73L10.26 9.54A5.55 5.55 0 0 0 13 12.28L13.81 11.54L15.59 12.73L15.22 13.98A0.96 0.96 0 0 1 14.11 14.65C11.22 14.13 8.93 11.84 8.41 8.95A0.96 0.96 0 0 1 9.07 7.84Z" />
      <path d="M13.4 7a2.6 2.6 0 0 1 2.6 2.6" />
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="3.75" />
      <path d="M17.25 6.75h.01" />
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M13.5 21v-7.25h2.45l.4-3h-2.85V8.9c0-.87.28-1.45 1.55-1.45H16.5V4.75c-.3-.04-1.2-.12-2.25-.12-2.3 0-3.75 1.4-3.75 3.95v2.17H8.1v3h2.4V21" />
    </svg>
  );
}

type LucideComponent = typeof Phone;

/** Lucide ikonica sa našom debljinom linije i aria-hidden podrazumevano. */
function withStroke(Icon: LucideComponent, name: string): ContactIcon {
  const Stroked = (props: IconProps) => (
    <Icon strokeWidth={ICON_STROKE} aria-hidden focusable="false" {...props} />
  );
  Stroked.displayName = name;
  return Stroked;
}

export const PhoneIcon = withStroke(Phone, "PhoneIcon");
export const MailIcon = withStroke(Mail, "MailIcon");
/** CTA "Zakaži" u dock-u i mobilnoj traci. */
export const BookingIcon = withStroke(CalendarCheck, "BookingIcon");

const icons: Record<ContactLinkId, ContactIcon> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  viber: ViberIcon,
  call: PhoneIcon,
  mail: MailIcon,
};

/** Ikonica za kontakt link — `const Icon = contactIcon(link.id); <Icon className="h-5 w-5" />`. */
export function contactIcon(id: ContactLinkId): ContactIcon {
  return icons[id];
}
