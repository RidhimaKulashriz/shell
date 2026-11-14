import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Shell: Get comfortable. We've got it.",
    short_name: "Shell",
    description: "One message. One plan. One person to ask.",
    start_url: "/app",
    display: "standalone",
    background_color: "#DAF1DE",
    theme_color: "#0B2B26",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
