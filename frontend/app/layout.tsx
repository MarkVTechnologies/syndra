import type { Metadata, Viewport } from "next";
import { inter, displayFont, jetbrainsMono } from "./fonts";
import { Toaster } from "sonner";
import { MotionProvider } from "@/components/providers/motion-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Syndran — Syndicators Ambassadors Network",
    template: "%s · Syndran",
  },
  description:
    "Earn recurring commission distributing vetted real-estate syndication deals.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Syndran",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Syndran",
    title: "Syndran — Syndicators Ambassadors Network",
    description:
      "Earn recurring commission distributing vetted real-estate syndication deals.",
  },
};

export const viewport: Viewport = {
  themeColor: "#05080D",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${displayFont.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <SessionProvider>
          <MotionProvider>{children}</MotionProvider>
        </SessionProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "var(--color-surface)",
              color: "var(--color-foreground)",
              border: "1px solid var(--color-border)",
            },
          }}
        />
      </body>
    </html>
  );
}
