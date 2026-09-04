import { Nav } from "@/components/sections/Nav";
import { Hero } from "@/components/sections/Hero";
import { Services } from "@/components/sections/Services";
import { Gallery } from "@/components/sections/Gallery";
import { Manifesto } from "@/components/sections/Manifesto";
import { Reviews } from "@/components/sections/Reviews";
import { About } from "@/components/sections/About";
import { Prices } from "@/components/sections/Prices";
import { Booking } from "@/components/sections/Booking";
import { Contact } from "@/components/sections/Contact";
import { SceneTheme } from "@/components/providers/SceneTheme";

/**
 * One-page struktura i "svetlo → tamno" dramaturgija:
 *  dan   — Hero (salon danju)
 *  noć   — scroll gasi svetla, pali neon; Usluge, Manifest, Radovi, Recenzije, Chris, Cenovnik, Zakazivanje
 *  jutro — Kontakt ("vidimo se ujutru") vraća svetlu temu
 */
export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />

        <SceneTheme theme="night" id="usluge">
          <Services />
        </SceneTheme>
        <SceneTheme theme="night" id="konsultacija">
          <Manifesto />
        </SceneTheme>
        <SceneTheme theme="night" id="radovi">
          <Gallery />
        </SceneTheme>
        <SceneTheme theme="night" id="recenzije">
          <Reviews />
        </SceneTheme>
        <SceneTheme theme="night" id="chris">
          <About />
        </SceneTheme>
        <SceneTheme theme="night" id="cenovnik">
          <Prices />
        </SceneTheme>
        <SceneTheme theme="night" id="zakazivanje">
          <Booking />
        </SceneTheme>

        <SceneTheme theme="day" id="kontakt">
          <Contact />
        </SceneTheme>
      </main>
    </>
  );
}
