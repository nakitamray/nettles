import type { Metadata, Viewport } from "next";
import { IM_Fell_English, League_Spartan } from "next/font/google";
import "./globals.css";

const spartan = League_Spartan({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-spartan",
});

const fell = IM_Fell_English({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-fell",
});

export const metadata: Metadata = {
  title: "Nettles",
  description: "A field for the letters you never sent.",
};

export const viewport: Viewport = {
  themeColor: "#14160f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spartan.variable} ${fell.variable}`}>
      <body>{children}</body>
    </html>
  );
}
