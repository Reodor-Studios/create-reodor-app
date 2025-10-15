import type { SeedClient, usersScalars } from "@snaplet/seed";
import { addMinutes, subDays } from "date-fns";
import { AuthUser, generateToken, seedPasswordToEncrypted } from "./shared";

/**
 * Define test users with different personas
 */
export const testUsersData: AuthUser[] = [
    {
        email: "admin@example.com",
        full_name: "Admin User",
    },
    {
        email: "alice@example.com",
        full_name: "Alice Johnson",
    },
    {
        email: "bob@example.com",
        full_name: "Bob Smith",
    },
    {
        email: "charlie@example.com",
        full_name: "Charlie Brown",
    },
    {
        email: "diana@example.com",
        full_name: "Diana Prince",
    },
];

/**
 * Helper function to create auth user with Supabase metadata
 * This creates a fully authenticated user with proper timestamps and tokens
 */
function createAuthUserWithSupabaseMetadata(user: AuthUser) {
    const encryptedPassword = seedPasswordToEncrypted["demo-password"];
    const now = new Date();
    const createdAt = subDays(now, 30); // Created 30 days ago
    const confirmedAt = addMinutes(createdAt, 5); // Confirmed 5 minutes after creation
    const lastSignInAt = subDays(now, 1); // Last signed in yesterday

    return {
        email: user.email,
        instance_id: "00000000-0000-0000-0000-000000000000",
        created_at: createdAt,
        updated_at: lastSignInAt,
        invited_at: null,
        confirmation_token: generateToken(),
        confirmation_sent_at: null,
        recovery_token: generateToken(),
        recovery_sent_at: createdAt,
        email_change_token_new: generateToken(),
        email_change: generateToken(),
        email_change_sent_at: null,
        email_confirmed_at: confirmedAt,
        confirmed_at: confirmedAt,
        last_sign_in_at: lastSignInAt,
        phone: null,
        phone_confirmed_at: null,
        phone_change: generateToken(),
        phone_change_token: generateToken(),
        phone_change_sent_at: null,
        email_change_token_current: generateToken(),
        email_change_confirm_status: 0,
        reauthentication_token: generateToken(),
        reauthentication_sent_at: null,
        is_sso_user: false,
        deleted_at: null,
        is_anonymous: false,
        is_super_admin: null,
        encrypted_password: encryptedPassword,
        banned_until: null,
        aud: "authenticated" as const,
        role: "authenticated" as const,
        raw_app_meta_data: {
            provider: "email",
            providers: ["email"],
        },
        raw_user_meta_data: {
            sub: "",
            email: user.email,
            full_name: user.full_name,
            email_verified: true,
            phone_verified: false,
        },
    };
}

/**
 * Creates test users with proper Supabase authentication setup
 * Profiles will be created automatically by database trigger
 */
export async function createTestUsersWithAuth(seed: SeedClient) {
    console.log("-- Creating test users with authentication setup...");

    const { users: allUsers } = await seed.users(
        testUsersData.map(createAuthUserWithSupabaseMetadata),
    );

    console.log(`-- Created ${allUsers.length} users`);
    return allUsers;
}

/**
 * Creates email identities for all users for Supabase authentication
 */
export async function createUserEmailIdentities(
    seed: SeedClient,
    users: usersScalars[],
) {
    console.log("-- Creating email identities for users...");

    await seed.identities(
        users.map((user) => ({
            user_id: user.id,
            provider_id: user.id,
            provider: "email",
            identity_data: {
                sub: user.id,
                email: user.email,
            },
            last_sign_in_at: new Date(),
        })),
    );

    console.log(`-- Created ${users.length} email identities`);
}
