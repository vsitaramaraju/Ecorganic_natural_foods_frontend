import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  build: {
    sourcemap: false,

    cssCodeSplit: true,

    chunkSizeWarningLimit: 700,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react-router-dom")) return "router";
            if (id.includes("react-dom") || id.includes("/react/")) return "react";
          }
        }
      }
    }
  }
});