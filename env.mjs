import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Server-side environment variables schema.
   * These are only accessible on the server.
   */
  server: {
    // Supabase
    SUPABASE_SECRET_KEY: z.string().min(1),
    DATABASE_URL: z.string().includes("://").optional(),

    // Google OAuth (optional)
    SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID: z.string().optional(),
    SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET: z.string().optional(),

    // Email configuration
    DEV_EMAIL_FROM: z.string().includes("@").or(z.string().regex(/^.+\s<.+@.+>$/)),
    DEV_EMAIL_TO: z.string().includes("@"),
    PROD_EMAIL_FROM: z.string().includes("@").or(z.string().regex(/^.+\s<.+@.+>$/)),
    ADMIN_EMAIL: z.string().includes("@").optional(),

    // Resend
    RESEND_API_KEY: z.string().min(1),

    // Cron secret for scheduled tasks
    CRON_SECRET: z.string().min(1),

    // Anthropic API for scaffold script
    ANTHROPIC_API_KEY: z.string().min(1),

    // JWT secret for account deletion tokens
    JWT_SECRET: z.string().min(32).default("fallback-secret-key-change-in-production"),

    // Node environment
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },

  /**
   * Client-side environment variables schema.
   * These are exposed to the browser and must be prefixed with NEXT_PUBLIC_.
   */
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().includes("://"),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY: z.string().min(1),
  },

  /**
   * Runtime environment variables.
   * For Next.js >= 13.4.4, you need to destructure all keys manually.
   */
  runtimeEnv: {
    // Server
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID:
      process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID,
    SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET:
      process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET,
    DEV_EMAIL_FROM: process.env.DEV_EMAIL_FROM,
    DEV_EMAIL_TO: process.env.DEV_EMAIL_TO,
    PROD_EMAIL_FROM: process.env.PROD_EMAIL_FROM,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV,

    // Client
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY,
  },

  /**
   * By default, this library will feed the environment variables directly to
   * the Zod validator. This means that if you have an empty string for a value,
   * Zod will incorrectly flag it as a type mismatch violation.
   *
   * Setting this to true will treat empty strings as undefined.
   */
  emptyStringAsUndefined: true,

  /**
   * Skip validation during build in environments where env vars aren't available yet
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
