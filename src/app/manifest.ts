import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Plumely — AI lighting visualization",
    short_name: "Plumely",
    description:
      "See any light fixture installed in your room before you buy.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#003ec7",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
