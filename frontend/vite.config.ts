import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import viteReact from "@vitejs/plugin-react";
import { lingui } from "@lingui/vite-plugin";
import macrosPlugin from "vite-plugin-babel-macros";
import { defineConfig } from "vite";

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tanstackRouter({
      autoCodeSplitting: true,
    }),
    macrosPlugin(),
    viteReact(),
    lingui(),
    ...(process.env.NODE_ENV !== "production" ? [basicSsl()] : []),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("@looker/sdk") || id.includes("@looker/embed-sdk")) {
            return "looker-vendor";
          }
          if (id.includes("node_modules/vega")) {
            return "vis-vendor";
          }
          if (
            id.includes("@tanstack/react-table") ||
            id.includes("@tanstack/react-virtual")
          ) {
            return "table-vendor";
          }
        },
      },
    },
  },
  server: {
    port: 8008,
    open: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8009",
        changeOrigin: true,
      },
    },
  },
});

export default config;
