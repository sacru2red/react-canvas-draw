import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.{js,jsx,ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
  },
});

