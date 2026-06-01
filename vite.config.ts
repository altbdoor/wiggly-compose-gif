import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "Update last modified",
      transformIndexHtml(html) {
        return html.replace("__LAST_DATE__", new Date().toISOString());
      },
    },
  ],
  base: process.env.VITE_BASE ?? "/",
  build: {
    reportCompressedSize: false,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "react",
              test: /node_modules\/react(-dom)?\//,
            },
          ],
        },
      },
    },
  },
});
