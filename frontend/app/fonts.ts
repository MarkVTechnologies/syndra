import { Inter, JetBrains_Mono } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// PRD §10.3 specifies Satoshi Variable (Fontshare) for Display. Fontshare
// fonts aren't on Google Fonts and can't be pulled at build time without
// local font files (licensing requires a manual download). Until those
// files are added under public/fonts/satoshi and swapped in via
// next/font/local, Display falls back to Inter 700/900 — visually close,
// zero build-time risk. See README "Fonts" section.
export const displayFont = Inter({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-satoshi",
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});
