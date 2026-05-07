import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: "proj_bzmovwpwstndmahnkjbm",
  runtime: "node",
  logLevel: "log",
  maxDuration: 300, // seconds
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 4,
      minTimeoutInMs: 2_000,
      maxTimeoutInMs: 20_000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["./src/trigger"],
});
