import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.js"],
    // Cada archivo levanta su propia base en memoria: se ejecutan en serie
    // para no competir por recursos ni por los límites de peticiones.
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 120000,
  },
});
