"use client";

import { Logo } from "@/components/brand/Logo";
import { site } from "@/lib/site";

const links = [
  { href: "#usluge", label: "Usluge" },
  { href: "#radovi", label: "Radovi" },
  { href: "#recenzije", label: "Recenzije" },
  { href: "#chris", label: "Chris" },
  { href: "#cenovnik", label: "Cenovnik" },
  { href: "#kontakt", label: "Kontakt" },
];

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-5 pt-4 md:px-8">
      <nav
        className="mx-auto flex h-14 max-w-7xl items-center justify-between rounded-full border border-line bg-bg/70 px-3 pl-4 backdrop-blur-md transition-colors duration-700"
        aria-label="Glavna navigacija"
      >
        <a href="#top" className="flex items-center gap-3 text-fg" aria-label="Na vrh">
          <Logo withText={false} className="h-9 w-9" />
          <span className="hidden text-sm font-medium tracking-wide sm:block">
            color cut <span className="text-display text-lg italic">Chris</span> and more
          </span>
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-full px-3.5 py-2 text-sm text-fg-muted transition-colors hover:bg-bg-elev hover:text-fg"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href={site.phone.href}
          className="inline-flex h-9 items-center rounded-full bg-accent px-4 text-sm font-medium text-accent-fg transition-transform duration-300 ease-out-expo hover:-translate-y-px"
        >
          Zakaži
        </a>
      </nav>
    </header>
  );
}
