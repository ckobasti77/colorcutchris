import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["lib/**/*.test.ts", "convex/**/*.test.ts"],
    // lib/* testovi rade u node-u; convex-test fajlovi traže edge-runtime i to
    // deklarišu sami (`// @vitest-environment edge-runtime` na vrhu fajla).
    environment: "node",
    exclude: ["**/node_modules/**", "**/.claude/**", "**/.next/**", "**/tests/**"],
    server: { deps: { inline: ["convex-test"] } },
  },
});
