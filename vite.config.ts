import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",

      injectManifest: {
        globPatterns: [
          "**/*.{js,css,html,ico,png,svg,webp,avif,jpg,jpeg,JPG,JPEG,gif,bmp}",
        ],
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
      },
    }),
  ],

  base: "/question-flow/",
});