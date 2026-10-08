import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { marked } from "marked";

const v1Date = "2026-09-24T14:45:03.617Z";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "Transform HTML files",
      transformIndexHtml(html, { path }) {
        let fixedHtml = html;
        let targetDate = new Date().toISOString();

        if (path.startsWith("/v1/")) {
          targetDate = v1Date;
        }

        fixedHtml = fixedHtml.replace("__LAST_DATE__", targetDate);

        if (fixedHtml.includes('<script type="text/markdown">')) {
          fixedHtml = fixedHtml.replace(
            /<script type="text\/markdown">(.+?)<\/script>/gs,
            (_, md) => marked.parse(md.trim(), { async: false }),
          );
        }

        return fixedHtml;
      },
    },
  ],
  base: process.env.VITE_BASE ?? "/",
  build: {
    reportCompressedSize: false,
    rolldownOptions: {
      input: {
        main: "index.html",
        help: "help.html",
        v1_main: "v1/index.html",
        v1_help: "v1/help.html",
      },
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
