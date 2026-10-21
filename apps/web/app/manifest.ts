import type { MetadataRoute } from "next";

/**
 * The web app manifest — what lets a phone or desktop browser offer
 * "Install" / "Add to Home Screen" and then open World Vitality in its own
 * window, like an app. Served at `/manifest.webmanifest`.
 *
 * `start_url` is the dashboard: an installed app that is signed in lands
 * where people look first, and one that isn't is sent to sign-in by the
 * dashboard's own gate. The colours match the page background in each
 * colour scheme (`--wv-bg`), so the splash screen doesn't flash a
 * different colour. There are deliberately no `shortcuts`: a manifest has
 * one fixed language, and the app is in five.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "World Vitality",
    short_name: "World Vitality",
    description: "World Vitality — See. Understand. Act.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#fbfaf7",
    theme_color: "#fbfaf7",
    categories: ["weather", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
