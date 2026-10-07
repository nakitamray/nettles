import type { Metadata, Viewport } from "next";
import { Reenie_Beanie, Shadows_Into_Light_Two } from "next/font/google";
import "./globals.css";

// Free stand-ins. The licensed fonts in public/fonts/licensed take over when present.
const handwriting = Shadows_Into_Light_Two({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-hand",
});

const ballpoint = Reenie_Beanie({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pen",
});

// The licensed handwriting fonts aren't in the repo. Locally they're read from
// public/fonts/licensed; in production FONT_BASE_URL points at wherever the
// files are hosted. If neither is there, the Google fonts above take over.
const fontBase = (process.env.FONT_BASE_URL ?? "/fonts/licensed").replace(/\/$/, "");

const licensedFonts = `
@font-face {
  font-family: "Dear Joe";
  src: url("${fontBase}/DearJoe.otf") format("opentype");
  font-display: swap;
}
@font-face {
  font-family: "Biro Script";
  src: url("${fontBase}/BiroScript.otf") format("opentype");
  font-display: swap;
}
`;

export const metadata: Metadata = {
  title: "Nettles",
  description: "A quiet field for the things you never got to say.",
};

export const viewport: Viewport = {
  themeColor: "#d8ceac",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${handwriting.variable} ${ballpoint.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: licensedFonts }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
