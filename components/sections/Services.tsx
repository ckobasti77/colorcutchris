import Image from "next/image";
import { services } from "@/lib/site";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Services() {
  return (
    <section className="px-6 py-28 md:px-10 lg:px-16" aria-labelledby="usluge-title">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Usluge"
          title={
            <span id="usluge-title">
              Četiri stvari radim <span className="italic">stvarno</span> dobro.
            </span>
          }
          lead="Ime salona je i spisak: color, cut — i sve ono više. Svaka usluga počinje razgovorom, ne kataloškom slikom."
        />

        <ul className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s, i) => (
            <Reveal as="li" key={s.id} delay={i * 0.07} className="group">
              <article className="flex h-full flex-col rounded-[28px] border border-line bg-bg-elev p-4 transition-[transform,box-shadow] duration-500 ease-out-expo hover:-translate-y-1 hover:shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)]">
                {/* luk — motiv ogledala iz salona */}
                <div className="mask-arch relative aspect-[4/5] w-full">
                  <Image
                    src={s.photo}
                    alt={s.alt}
                    fill
                    sizes="(min-width:1024px) 22vw, (min-width:640px) 45vw, 90vw"
                    className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
                  />
                </div>
                <div className="flex flex-1 flex-col px-1 pt-6 pb-1">
                  <p className="text-xs uppercase tracking-[0.22em] text-accent">{s.label}</p>
                  <h3 className="text-display mt-2 text-3xl text-fg">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-fg-muted">{s.blurb}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
