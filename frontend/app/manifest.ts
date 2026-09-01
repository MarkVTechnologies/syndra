import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Syndicators Ambassadors Network",
    short_name: "SAN",
    description: "Earn recurring commission distributing vetted real-estate syndication deals.",
    start_url: "/dashboard?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#05080D",
    theme_color: "#05080D",
    categories: ["finance", "business"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-256.png", sizes: "256x256", type: "image/png" },
      { src: "/icons/icon-384.png", sizes: "384x384", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "My Microsite", url: "/dashboard/microsite" },
      { name: "Earnings", url: "/dashboard/earnings" },
      { name: "Opportunities", url: "/dashboard/opportunities" },
    ],
  };
}
