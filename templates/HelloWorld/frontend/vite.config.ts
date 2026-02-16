import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./", // Use relative paths instead of absolute
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
