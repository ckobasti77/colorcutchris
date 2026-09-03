import { priceList } from "@/lib/site";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Prices() {
  return (
    <section className="px-6 py-28 md:px-10 lg:px-16" aria-labelledby="cenovnik-title">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Cenovnik"
          title={
            <span id="cenovnik-title">
              Bez <span className="italic">iznenađenja</span> na kasi.
            </span>
          }
          lead="Cene su orijentacione — tačan iznos dogovaramo na konsultaciji, pre nego što počnemo, jer dužina i gustina kose menjaju utrošak boje."
        />

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {priceList.map((group) => (
            <div key={group.group}>
              <h3 className="text-display mb-5 text-3xl text-fg">{group.group}</h3>
              <ul className="divide-y divide-line border-y border-line">
                {group.items.map((it) => (
                  <li key={it.name} className="flex items-baseline justify-between gap-4 py-4">
                    <div>
                      <p className="text-sm text-fg">{it.name}</p>
                      {it.note && <p className="mt-0.5 text-xs text-fg-muted">{it.note}</p>}
                    </div>
                    <p className="shrink-0 text-sm tabular-nums text-fg-muted">{it.price}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-10 text-xs uppercase tracking-[0.2em] text-fg-muted">
          {/* TODO: zameniti pravim cenama iz "KARTE" */}
          cene · uskoro · prema karti iz salona
        </p>
      </div>
    </section>
  );
}
