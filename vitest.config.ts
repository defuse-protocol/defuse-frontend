import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom", // Provides DOM APIs (document, window, localStorage) needed for React component testing
    setupFiles: ["./src/tests/setup.ts"],
    alias: {
      "@src": "/src",
    },
  },
  esbuild: {
    jsx: "automatic", // use react-jsx transform
  },
})
