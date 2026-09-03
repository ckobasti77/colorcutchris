/**
 * Naslov sekcije. Bez ijedne animacije — copy hvata site-wide reč-po-reč otkrivanje
 * (vidi .claude/skills/text-reveal). Ne dodavati Reveal ni fade oko teksta.
 */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
      <h2 className="text-display text-[clamp(2rem,4.6vw,3.75rem)] text-fg">{title}</h2>
      {lead && <p className="mt-5 text-base leading-relaxed text-fg-muted md:text-lg">{lead}</p>}
    </div>
  );
}
