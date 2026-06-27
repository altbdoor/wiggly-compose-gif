import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { marked } from "marked";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "Transform HTML files",
      transformIndexHtml(html) {
        let fixedHtml = html;
        fixedHtml = fixedHtml.replace("__LAST_DATE__", new Date().toISOString());

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
