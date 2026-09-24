import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      manifest: {
        name: "Everly",
        short_name: "Everly",
        description: "Every moment, together.",
        theme_color: "#e85d75",
        background_color: "#fff8fa",
        display: "standalone",
        orientation: "portrait",

        icons: [
          {
            src: "/everly-icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/everly-icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/everly-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },

      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: "/index.html",
      },
    }),
  ],
});