import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom", // Provides DOM APIs (document, window, localStorage) needed for React component testing
    setupFiles: ["./src/tests/setup.ts"],
    alias: {
      "@src": "/src",
    },
    include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
    exclude: ["test/**/*", "node_modules/**/*"],
    deps: {
      // Emil: I don't understand why vitest complains about "@hot-labs/omni-sdk".
      //       And why processing our intents-sdk fixes the problem.
      inline: ["@defuse-protocol/intents-sdk"]
    }
  },
  esbuild: {
    jsx: "automatic", // use react-jsx transform
  },
})
