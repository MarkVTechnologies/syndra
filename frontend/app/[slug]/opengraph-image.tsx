import { ImageResponse } from "next/og";
import * as ambassador from "@san/service-ambassador";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await ambassador.getMicrosite(slug);
  const name = result.ok ? result.data.ambassador.fullName : "SAN Ambassador";
  const headline = result.ok
    ? result.data.ambassador.headline
    : "Vetted real-estate syndication deals";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#05080D",
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(5,150,105,0.35), transparent 55%), radial-gradient(circle at 80% 70%, rgba(212,175,55,0.18), transparent 55%)",
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 700, color: "#D4AF37", letterSpacing: -0.5, display: "flex" }}>
          SAN
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 64,
            fontWeight: 800,
            color: "#FFFFFF",
            textAlign: "center",
            maxWidth: 900,
            display: "flex",
          }}
        >
          {name}
        </div>
        {headline && (
          <div style={{ marginTop: 16, fontSize: 28, color: "#94A3B8", textAlign: "center", maxWidth: 800, display: "flex" }}>
            {headline}
          </div>
        )}
      </div>
    ),
    { ...size }
  );
}
