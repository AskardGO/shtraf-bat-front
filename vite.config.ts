import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
  plugins: [react()],

    resolve: {
        alias: {
            app: path.resolve(__dirname, "./src/app"),
            features: path.resolve(__dirname, "./src/features"),
            shared: path.resolve(__dirname, "./src/shared"),
            widgets: path.resolve(__dirname, "./src/widgets"),
            entities: path.resolve(__dirname, "./src/entities"),
        },
    },

  clearScreen: false,

  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
