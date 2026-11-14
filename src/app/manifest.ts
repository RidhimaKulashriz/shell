import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Shell",
    short_name: "Shell",
    description: "Get comfortable. We've got it.",
    start_url: "/",
    display: "standalone",
    background_color: "#DAF1DE",
    theme_color: "#0B2B26",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
