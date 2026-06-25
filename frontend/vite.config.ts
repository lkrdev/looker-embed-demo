import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import viteReact from "@vitejs/plugin-react";
import { lingui } from "@lingui/vite-plugin";
import { defineConfig } from "vite";

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tanstackRouter(),
    viteReact(),
    lingui(),
    ...(process.env.NODE_ENV !== "production" ? [basicSsl()] : []),
  ],
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
