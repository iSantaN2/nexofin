import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // PDF export is intentionally lazy-loaded and jsPDF is naturally large.
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@firebase/firestore") || id.includes("firebase/firestore")) {
              return "vendor-firebase-firestore";
            }
            if (id.includes("@firebase/auth") || id.includes("firebase/auth")) {
              return "vendor-firebase-auth";
            }
            if (id.includes("@firebase/analytics") || id.includes("firebase/analytics")) {
              return "vendor-firebase-analytics";
            }
            if (id.includes("@firebase") || id.includes("firebase/")) return "vendor-firebase-core";
            if (id.includes("jspdf") || id.includes("html2canvas")) return "vendor-pdf";
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router-dom")) {
              return "vendor-react";
            }
            return undefined;
          }
          return null;
        },
      },
    },
  },
});
