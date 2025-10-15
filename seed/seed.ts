import { createSeedClient } from "@snaplet/seed";
import {
    createTestUsersWithAuth,
    createTodoItems,
    createUserEmailIdentities,
} from "./utils";

/**
 * Main seed function that orchestrates the database seeding process
 * Creates test users with authentication and sample todo items
 */
async function main() {
    console.log("-- Starting database seeding...");
    const seed = await createSeedClient({
        dryRun: true,
    });

    // Clear existing data
    console.log("-- Resetting database...");
    await seed.$resetDatabase();

    // 1. Create users with authentication
    console.log("\n-- Phase 1: User Management");
    const allUsers = await createTestUsersWithAuth(seed);
    await createUserEmailIdentities(seed, allUsers);

    // Note: If you have a database trigger that auto-creates profiles,
    // you can skip this step. Otherwise, uncomment the line below:
    // await createUserProfiles(seed, allUsers);

    // 2. Create todo items for users
    console.log("\n-- Phase 2: Todo Items");
    const todos = await createTodoItems(seed, allUsers);

    console.log("\n--  Database seeding completed successfully!");
    console.log("--");
    console.log("-- =� Seeding Summary:");
    console.log(`--   =e Users: ${allUsers.length}`);
    console.log(`--    Todo Items: ${todos.length}`);
    console.log("--");
    console.log("-- = Test Accounts:");
    console.log("--   =� admin@example.com");
    console.log("--   =� alice@example.com");
    console.log("--   =� bob@example.com");
    console.log("--   =� charlie@example.com");
    console.log("--   =� diana@example.com");
    console.log("--   = Password for all: demo-password");
    console.log("--");

    process.exit(0);
}

main().catch((e) => {
    console.error("-- L Seed failed:", e);
    process.exit(1);
});
