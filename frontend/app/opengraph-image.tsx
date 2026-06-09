import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

// Site-wide Open Graph / Twitter card. Rendered at build time by Next.js.
export const runtime = "edge";
export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "radial-gradient(120% 120% at 0% 0%, #1a1040 0%, #0a0a18 55%, #06060f 100%)",
          color: "#f0f0ff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo mark + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 44 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
              fontSize: 46,
              fontWeight: 800,
              color: "#fff",
            }}
          >
            A
          </div>
          <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: "0.06em" }}>ARBIQ</div>
        </div>

        <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, maxWidth: 920 }}>
          Freelance work where the contract enforces payment.
        </div>

        <div style={{ fontSize: 30, color: "#a0a0c8", marginTop: 32, maxWidth: 880 }}>
          AI-enforced escrow on GenLayer · 0% platform fees · paid in GEN
        </div>

        {/* Accent bar */}
        <div
          style={{
            marginTop: 48,
            width: 220,
            height: 8,
            borderRadius: 4,
            background: "linear-gradient(90deg, #7c3aed, #38bdf8)",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
