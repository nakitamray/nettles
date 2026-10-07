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
      <body>{children}</body>
    </html>
  );
}
