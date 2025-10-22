---
name: database-seeding
description: Generate comprehensive test data for local development using Snaplet and Supabase. Use when adding database schema changes, implementing new features, or creating edge case scenarios. Ensures reproducible test environments with realistic data covering happy paths, error cases, and RLS policies.
---

# Database Seeding

Generate realistic, reproducible test data for local development that covers happy paths, edge cases, and security scenarios before they hit production.

## Overview

Database seeding populates your local database with test data using Snaplet. This creates consistent test environments across developers and helps catch edge cases early. Seed data is automatically applied when running `supabase db reset`.

## When to Update Seed Scripts

Update seed scripts in these scenarios:

1. **After Schema Changes** - New tables, columns, or enums need test data
2. **New Features** - Create data covering all feature scenarios
3. **Edge Cases Discovered** - Add specific test cases for bugs found
4. **Complex Business Rules** - Test validation logic, constraints, and workflows
5. **RLS Policy Changes** - Verify Row Level Security works correctly

## Seeding Workflow

### Complete Workflow After Schema Changes

```bash
# 1. Generate migration (if not done)
bun db:diff add_feature

# 2. Apply migration
bun migrate:up

# 3. Generate TypeScript types (CRITICAL - do this first!)
bun gen:types

# 4. Sync Snaplet with new schema
bun seed:sync

# 5. Update seed/seed.ts with new data scenarios

# 6. Generate seed SQL
bun seed

# 7. Reset database and apply seed
bun db:reset
```

**Critical**: Always run `bun gen:types` before `bun seed:sync` to ensure Snaplet's data model aligns with your current schema.

### Quick Workflow for Seed Script Updates

When only updating seed logic (no schema changes):

```bash
# 1. Update seed/seed.ts

# 2. Generate new seed.sql
bun seed

# 3. Reset database
bun db:reset
```

## Seed Directory Structure

```txt
seed/
├── seed.ts              # Main orchestration script
└── utils/
    ├── index.ts         # Exported utility functions
    ├── shared.ts        # Shared types and helpers
    ├── profiles.ts      # User creation utilities
    ├── todos.ts         # Todo-specific seeding
    └── media.ts         # Media attachment utilities
.snaplet/
└── (Snaplet generated files after sync. Never update manually.)
```

## Creating Edge Case Scenarios

### The Problem Without Seed Scripts

Manual testing for a discount code feature:

- Create 5 test users
- Create 5 discount codes (valid, expired, maxed out, inactive, user-specific)
- Create 5 orders with different amounts
- Test each combination
- **Repeat every time you reset your database**

### The Solution with Seed Scripts

```typescript
// seed/utils/discounts.ts
export async function createDiscountCodes(
  seed: SeedClient,
  users: usersScalars[]
) {
  const now = new Date();

  await seed.discount_codes([
    // 1. Valid discount - Happy path
    {
      code: "WELCOME10",
      discount_percentage: 10,
      expires_at: addDays(now, 30).toISOString(),
      max_uses: 100,
      current_uses: 0,
      is_active: true,
    },

    // 2. Expired discount - Should reject
    {
      code: "EXPIRED20",
      expires_at: subDays(now, 1).toISOString(),
      is_active: true,
    },

    // 3. Max usage reached - Should reject
    {
      code: "MAXEDOUT",
      max_uses: 50,
      current_uses: 50,
      is_active: true,
    },

    // 4. User-specific (single-use)
    {
      code: "FIRSTPURCHASE",
      user_id: users[0].id,
      max_uses: 1,
      is_active: true,
    },
  ]);

  console.log("--   Edge cases covered:");
  console.log("--   ✓ Valid discount");
  console.log("--   ✓ Expired discount");
  console.log("--   ✓ Max usage reached");
  console.log("--   ✓ User-specific discount");
}
```

Now run `bun db:reset` and instantly have all test scenarios ready!

## Seed Script Structure

### Main Orchestration (seed/seed.ts)

```typescript
import { createSeedClient } from "@snaplet/seed";
import { createTestUsersWithAuth, createFeatureData } from "./utils";

async function main() {
  console.log("-- Starting database seeding...");

  const seed = await createSeedClient({
    dryRun: true, // Generates SQL without executing
  });

  // Clear existing data
  await seed.$resetDatabase();

  // Phase 1: Create users (no dependencies)
  const users = await createTestUsersWithAuth(seed);

  // Phase 2: Create feature data (depends on users)
  const items = await createFeatureData(seed, users);

  console.log("\n-- Seeding completed!");
  console.log(`--   Users: ${users.length}`);
  console.log(`--   Items: ${items.length}`);

  process.exit(0);
}

main().catch((e) => {
  console.error("-- Seed failed:", e);
  process.exit(1);
});
```

### Utility Functions (seed/utils/)

Organize seed logic by feature:

```typescript
// seed/utils/todos.ts
import type { SeedClient, usersScalars } from "@snaplet/seed";
import { DatabaseTables } from "./shared";

export async function createTodoItems(seed: SeedClient, users: usersScalars[]) {
  const todos: DatabaseTables["todos"]["Insert"][] = [];

  for (const user of users) {
    // Create varied scenarios
    todos.push(
      // Completed todo
      {
        user_id: user.id,
        title: "Completed task",
        completed: true,
      },
      // Overdue todo
      {
        user_id: user.id,
        title: "Overdue task",
        due_date: subDays(new Date(), 3).toISOString(),
        completed: false,
      },
      // High priority todo
      {
        user_id: user.id,
        title: "Urgent task",
        priority: "high",
        completed: false,
      }
    );
  }

  const result = await seed.todos(todos);
  console.log(`-- Created ${result.todos.length} todos`);
  return result.todos;
}
```

## Testing Row Level Security (RLS)

Create data for different users to verify RLS policies:

```typescript
export async function createRLSTestData(
  seed: SeedClient,
  users: usersScalars[]
) {
  const [alice, bob] = users;

  // Alice's private todos (she should see these)
  await seed.todos([{ user_id: alice.id, title: "Alice's private todo" }]);

  // Bob's private todos (Alice should NOT see these)
  await seed.todos([{ user_id: bob.id, title: "Bob's private todo" }]);

  console.log("--   RLS scenarios:");
  console.log("--   ✓ User-specific data (Alice)");
  console.log("--   ✓ User-specific data (Bob)");
}
```

## Best Practices

### 1. Cover Edge Cases Explicitly

Don't rely on random data alone:

```typescript
// ✅ GOOD - Explicit edge cases
const discounts = [
  { code: "VALID", expires_at: future },
  { code: "EXPIRED", expires_at: past },
  { code: "MAXED", current_uses: max_uses },
];

// ❌ AVOID - Only random data
const discounts = Array.from({ length: 10 }, () => ({
  code: randomCode(),
  expires_at: randomDate(),
}));
```

### 2. Use Realistic Data

```typescript
// ✅ GOOD
const todoTemplates = [
  { title: "Complete project documentation", priority: "high" },
  { title: "Review pull requests", priority: "medium" },
  { title: "Update dependencies", priority: "low" },
];

// ❌ AVOID
{ title: "Test 1", priority: "high" }
```

### 3. Create Dependent Data in Phases

```typescript
// Phase 1: Users (no dependencies)
const users = await createUsers(seed);

// Phase 2: Todos (depend on users)
const todos = await createTodos(seed, users);

// Phase 3: Attachments (depend on todos)
await createAttachments(seed, todos);
```

### 4. Log What You're Creating

```typescript
console.log("--   Edge cases covered:");
console.log("--   ✓ Valid discount");
console.log("--   ✓ Expired discount");
console.log("--   ✓ Max usage reached");
```

### 5. Use Date Utilities

```typescript
import { addDays, subDays, addMonths } from "date-fns";

// Expired discount
expires_at: subDays(new Date(), 1).toISOString();

// Future expiry
expires_at: addDays(new Date(), 30).toISOString();
```

## Troubleshooting

### Snaplet Out of Sync

**Problem**: Schema changed but Snaplet doesn't recognize new columns

**Solution**:

```bash
bun gen:types    # MUST run this first
bun seed:sync    # Then sync Snaplet
```

### Type Errors in Seed Script

**Problem**: TypeScript errors for database types

**Solution**:

```bash
bun gen:types    # Regenerate types
# Then fix seed script imports
```

### Seed SQL Not Updating

**Problem**: Changes to seed.ts not reflected in seed.sql

**Solution**:

```bash
bun seed         # Regenerate seed.sql
bun db:reset     # Apply new seed
```

## Related Documentation

- [Snaplet Documentation](https://docs.snaplet.dev/) - Official Snaplet docs
- Project seed examples: `seed/utils/*.ts` - Existing patterns to follow
