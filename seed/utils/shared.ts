import { Database } from "../../types/database.types";

export type SeedPassword = "demo-password";

/**
 * Pre-encrypted password for "demo-password"
 * Generated using bcrypt with cost factor 10
 */
export const seedPasswordToEncrypted: Record<SeedPassword, string> = {
  "demo-password":
    "$2a$10$JEpaf.puIXxfqjkPaNCLle3a0yB4x2XbnTUH7L5SoK7J45bpeykla",
};

/**
 * Generates a random token for Supabase auth fields
 */
export function generateToken(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

/**
 * Type for a user during seeding
 */
export type AuthUser = {
  email: string;
  full_name: string;
};

/**
 * Type helper for database table inserts
 */
export type DatabaseTables = Database["public"]["Tables"];
