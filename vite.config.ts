import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // dragula (AdminUX shopping board) references Node's `global`; map it for browser ESM.
  define: {
    global: "globalThis",
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Prevent Workbox from registering a service worker during `npm run dev`.
      devOptions: {
        enabled: false,
      },
      registerType: "autoUpdate",
      includeAssets: [
        "pwa-192.png",
        "pwa-512.png",
        "pwa-512-maskable.png",
        "apple-touch-icon.png",
      ],
      manifest: {
        name: "FamilySite 491",
        short_name: "FamilySite",
        description:
          "Household hub — calendar, pantry, shopping, messages, and kitchen workflows.",
        theme_color: "#F26522",
        background_color: "#f7f7f7",
        display: "standalone",
        orientation: "any",
        scope: "/",
        start_url: "/",
        categories: ["lifestyle", "productivity"],
        icons: [
          {
            src: "pwa-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
        maximumFileSizeToCacheInBytes: 5_000_000,
      },
    }),
  ],
  build: {
    target: "es2022",
    sourcemap: false,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@supabase")) {
              return "supabase";
            }
            if (id.includes("@zxing")) {
              return "vendor-zxing";
            }
            if (id.includes("qrcode.react")) {
              return "vendor-qrcode";
            }
            if (id.includes("lucide-react")) {
              return "vendor-lucide";
            }
            if (
              id.includes("react-dom") ||
              id.includes("/react/") ||
              id.includes("scheduler")
            ) {
              return "vendor-react";
            }
            return;
          }
          if (
            id.includes("/ChoreAnalyticsAgent") ||
            id.includes("/analytics/AnalyticsCharts") ||
            id.includes("choreAnalyticsAgent")
          ) {
            return "chore-analytics";
          }
          if (
            id.includes("/choreData") ||
            id.includes("choreZipSeed") ||
            id.includes("choreAiSuggestions")
          ) {
            return "chore-data";
          }
        },
      },
    },
  },
  optimizeDeps: {
    entries: ["index.html"],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: "localhost",
    watch: {
      ignored: ["**/vendor/**", "**/node_modules/**"],
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
    host: "localhost",
  },
});
