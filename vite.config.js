import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("recharts") || id.includes("d3-") || id.includes("victory-") || id.includes("react-smooth")) {
              return "recharts";
            }
            if (id.includes("react-dom")) {
              return "vendor";
            }
            if (id.includes("react") && !id.includes("react-dom")) {
              return "vendor";
            }
            if (id.includes("@supabase")) {
              return "supabase";
            }
            return "vendor";
          }
        },
      },
    },
  },
});
