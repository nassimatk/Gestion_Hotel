import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000,
  },

  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/tests/setup.js",

    coverage: {
      provider: "istanbul",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{js,jsx}"],
      exclude: [
        "src/main.jsx",
        "src/tests/**",
      ],
    },
  },
});
