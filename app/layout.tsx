import type { Metadata, Viewport } from "next";
import { Fraunces, Geist } from "next/font/google";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { hideCss } from "@/constants/textRevealConfig";
import { site } from "@/lib/site";
import "./globals.css";

/**
 * Copy se krije pre prvog paint-a (inline <style>), ali samo pod `html.js` —
 * bez JS-a nema ko da ga vrati, pa tada ostaje vidljiv.
 */
const JS_FLAG = `document.documentElement.classList.add("js")`;

/** Marker builda: `<meta name="build">` — po njemu proveravamo da produkcija servira poslednji commit. */
const BUILD = process.env.VERCEL_GIT_COMMIT_SHA ?? "dev";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  axes: ["opsz", "SOFT"],
  display: "swap",
});

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: "color cut Chris and more — frizerski salon, Beograd",
  description:
    "Farbanje, šišanje, styling i svečane frizure. Salon Chris u Beogradu — topao prostor, iskren rad, slike koje ne retuširamo. Zakaži termin onlajn.",
  openGraph: {
    title: "color cut Chris and more",
    description: "Farbanje, šišanje, styling i svečane frizure u Beogradu. Zakaži termin onlajn.",
    locale: "sr_RS",
    type: "website",
  },
  other: { build: BUILD },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4efe6" },
    { media: "(prefers-color-scheme: dark)", color: "#1d2a22" },
  ],
};

/**
 * Koren: fontovi, tokeni, Convex klijent. Javni sajt (smooth scroll, reč-po-reč
 * otkrivanje, kontakt-traka) živi u app/(site)/layout.tsx; /admin ih ne dobija.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="sr-Latn"
      className={`${fraunces.variable} ${geist.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: JS_FLAG }} />
        <style dangerouslySetInnerHTML={{ __html: hideCss() }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
