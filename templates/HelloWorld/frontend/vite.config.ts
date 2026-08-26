import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./", // Use relative paths instead of absolute
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
    // src/services/index.ts awaits createClient() at the top level, which
    // Vite's default target ("modules" — es2020) cannot transpile.
    target: "es2022",
  },
});
