import { LOGO_FILL, LOGO_VIEWBOX } from "@/lib/brand/logo-data";

type Props = {
  className?: string;
  /** Prikaži i "color cut" / "and more" tekst. */
  withText?: boolean;
  title?: string;
};

/**
 * Logo salona kao vektor (ink varijanta). Boja = currentColor.
 * Potpis je vektorizovan iz originalnog loga — ne koristimo font.
 */
export function Logo({ className, withText = true, title = "color cut Chris and more" }: Props) {
  const { x, y, w, h } = LOGO_VIEWBOX;
  return (
    <svg
      viewBox={`${x} ${y} ${w} ${h}`}
      className={className}
      role="img"
      aria-label={title}
      fill="currentColor"
      fillRule="evenodd"
    >
      <path d={LOGO_FILL.arc} />
      <path d={LOGO_FILL.signature} />
      {withText && <path d={LOGO_FILL.text} />}
    </svg>
  );
}
