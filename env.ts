import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    POCKETBASE_INTERNAL_URL: z.string().url(),
    POCKETBASE_SERVICE_EMAIL: z.string().email(),
    POCKETBASE_SERVICE_PASSWORD: z.string().min(32),
    AUTH_STATE_SECRET: z.string().min(32),
    // Validated together when the lazy study map requests its runtime config.
    // These runtime-only values are deliberately absent from image builds.
    TIMEKEEPER_SUPABASE_URL: z.string().url().optional(),
    TIMEKEEPER_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    POCKETBASE_INTERNAL_URL: process.env.POCKETBASE_INTERNAL_URL,
    POCKETBASE_SERVICE_EMAIL: process.env.POCKETBASE_SERVICE_EMAIL,
    POCKETBASE_SERVICE_PASSWORD: process.env.POCKETBASE_SERVICE_PASSWORD,
    AUTH_STATE_SECRET: process.env.AUTH_STATE_SECRET,
    TIMEKEEPER_SUPABASE_URL: process.env.TIMEKEEPER_SUPABASE_URL,
    TIMEKEEPER_SUPABASE_ANON_KEY: process.env.TIMEKEEPER_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined.
   * `SOME_VAR: z.string()` and `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
