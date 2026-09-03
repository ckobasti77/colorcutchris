import Image from "next/image";
import { salonPhotos, site } from "@/lib/site";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function About() {
  const [workplace, neon, counter] = salonPhotos;
  return (
    <section className="px-6 py-28 md:px-10 lg:px-16" aria-labelledby="chris-title">
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.95fr_1.05fr]">
        {/* kolaž salona — luk (ogledalo) + dve manje */}
        <div className="relative mx-auto grid w-full max-w-[520px] grid-cols-[1.35fr_1fr] gap-4 lg:mx-0">
          <Reveal className="mask-arch relative aspect-[3/4] w-full">
            <Image
              src={workplace.src}
              alt={workplace.alt}
              fill
              sizes="(min-width:1024px) 30vw, 60vw"
              className="object-cover"
            />
          </Reveal>
          <div className="flex flex-col gap-4 pt-10">
            <Reveal delay={0.08} className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl">
              <Image src={neon.src} alt={neon.alt} fill sizes="22vw" className="object-cover" />
            </Reveal>
            <Reveal delay={0.14} className="relative aspect-square w-full overflow-hidden rounded-2xl">
              <Image src={counter.src} alt={counter.alt} fill sizes="22vw" className="object-cover" />
            </Reveal>
          </div>
        </div>

        <div>
          <SectionHeading
            eyebrow="To sam ja"
            title={
              <span id="chris-title">
                Kristian. Kolorista, frizer, <span className="italic">domaćin</span>.
              </span>
            }
          />
          {/* proza — bez Reveal omotača, pasusi stižu reč po reč */}
          <div className="mt-8 space-y-5 text-base leading-relaxed text-fg-muted md:text-lg">
            <p>
              Salon sam uredio kao stan u koji bih voleo da dođem: ratan, zelena sofa, tapeta sa
              magnolijama, dosta svetla i neon koji se pali kad počne veče. Nema recepcije, nema
              čekanja u redu — jedan gost, jedan frizer, jedan razgovor.
            </p>
            <p>
              Radim sa Goldwell bojama zato što ih poznajem do nijanse. Ali boja je alat; posao
              je da razumem šta hoćeš da vidiš u ogledalu za mesec dana, kad izraste.
            </p>
            <p>
              Gosti me prate godinama, i kad promenim adresu. Sad sam u Bojanskoj{" "}
              {site.address.street.split(" ")[1]}, na Zvezdari — dođi na kafu i razgovor pre
              nego što išta odlučimo.
            </p>
            <p className="text-sm text-fg-muted/80">
              {/* TODO: biografija od klijenta — godine iskustva, edukacije, specijalnosti, portret */}
              <em>— biografija i portret čekaju Kristiana —</em>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
