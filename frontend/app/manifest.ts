import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Arbiq — Trustless Freelance on GenLayer",
    short_name: "Arbiq",
    description:
      "AI-enforced freelance escrow marketplace on GenLayer. Post work, get paid in GEN — no middlemen.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#7c3aed",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon.svg", type: "image/svg+xml", sizes: "180x180" },
    ],
  };
}
