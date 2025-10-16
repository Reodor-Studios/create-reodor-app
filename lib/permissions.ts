import type { Database } from "@/types/database.types";

type UserRole = Database["public"]["Enums"]["user_role"];

// Role hierarchy: customer < stylist < admin
const ROLE_HIERARCHY: Record<UserRole, number> = {
    user: 1,
    admin: 2,
};

/**
 * Check if a user has at least the required role
 * @param userRole - The user's current role
 * @param requiredRole - The minimum role required
 * @returns true if user has sufficient permissions
 */
export function hasPermission(
    userRole: UserRole,
    requiredRole: UserRole,
): boolean {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if a user is an admin
 * @param userRole - The user's current role
 * @returns true if user is an admin
 */
export function isAdmin(userRole: UserRole): boolean {
    return hasPermission(userRole, "admin");
}

/**
 * Get the role hierarchy level
 * @param role - The user role
 * @returns the hierarchy level (1-3)
 */
export function getRoleLevel(role: UserRole): number {
    return ROLE_HIERARCHY[role];
}

/**
 * Get all roles that are at least as privileged as the given role
 * @param role - The minimum role
 * @returns array of roles with equal or higher privileges
 */
export function getRolesAtLeast(role: UserRole): UserRole[] {
    const requiredLevel = ROLE_HIERARCHY[role];
    return Object.entries(ROLE_HIERARCHY)
        .filter(([, level]) => level >= requiredLevel)
        .map(([roleName]) => roleName as UserRole);
}
