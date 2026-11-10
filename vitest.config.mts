import { loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["**/*.test.ts"],
          exclude: ["**/*.int.test.ts", "node_modules/**", "e2e/**"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["**/*.int.test.ts"],
          exclude: ["node_modules/**"],
          environment: "node",
          fileParallelism: false,
          // Supabase local (.env.development.local)
          env: loadEnv("development", process.cwd(), ""),
        },
      },
    ],
  },
});
