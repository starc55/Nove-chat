import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
      "/socket.io": { target: "ws://localhost:4000", ws: true }
    }
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("leaflet")) return "maps";
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("socket.io") || id.includes("engine.io")) return "realtime";
          if (id.includes("react") || id.includes("scheduler")) return "react-vendor";
          return "vendor";
        }
      }
    }
  }
});
