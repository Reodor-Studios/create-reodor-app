# TanStack DB Todo Dashboard Implementation

## Purpose

This document serves as a research and implementation guide for adding a **Todo Dashboard** feature that demonstrates TanStack DB's live query capabilities. The dashboard will show real-time computed statistics from the existing todo data.

**RE-READ THIS DOCUMENT** if context is lost during implementation.

## What is TanStack DB?

TanStack DB is a reactive client-first store that extends TanStack Query with:

- **Collections**: Typed containers for normalized data
- **Live Queries**: Sub-millisecond reactive queries using differential dataflow
- **Optimistic Mutations**: Instant UI updates with automatic rollback

Key difference from TanStack Query: While Query fetches and caches data, DB adds normalized collections and cross-collection live queries that update incrementally.

## Implementation Plan

### Goal

Add a dashboard tab to `/oppgaver` that shows live-computed statistics:

- Total todos count
- Completed / Pending counts
- Completion rate percentage
- Breakdown by priority (high/medium/low)
- Overdue count
- Due today count

### Why This Demo is Valuable

1. Shows TanStack DB's killer feature: **live queries that recompute instantly**
2. Same todo collection powers both the list AND the dashboard
3. Zero changes to existing todo list functionality
4. Practical pattern (dashboards are common in real apps)

## Technical Details

### Installation

```bash
bun add @tanstack/react-db @tanstack/query-db-collection
```

### Packages

- `@tanstack/react-db` - React bindings with `useLiveQuery` hook (re-exports everything from `@tanstack/db`)
- `@tanstack/query-db-collection` - Bridge between TanStack Query and DB collections

### React Hooks Available

1. `useLiveQuery` - Basic live query hook, returns `{ data, isLoading }`
2. `useLiveInfiniteQuery` - For paginated data with live updates
3. `useLiveSuspenseQuery` - Integrates with React Suspense

### queryCollectionOptions Requirements

```typescript
queryCollectionOptions({
  queryKey: ["todos"],           // TanStack Query cache key
  queryFn: async () => [...],    // Data fetching function
  queryClient,                   // Required: QueryClient instance
  getKey: (item) => item.id,     // Extract unique ID
  // Optional:
  enabled: true,
  staleTime: 1000 * 60 * 5,
  schema: zodSchema,
})
```

### Key APIs

#### Creating a Collection

```typescript
import { createCollection } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";

const todoCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["todos"],
    queryFn: async () => {
      // Fetch from API/Supabase
      return todos;
    },
    getKey: (item) => item.id,
  })
);
```

#### Live Queries with useLiveQuery

```typescript
import { useLiveQuery, eq, count, sum } from "@tanstack/react-db";

// Basic query
const { data: todos } = useLiveQuery((q) =>
  q.from({ todo: todoCollection }).where(({ todo }) => eq(todo.completed, true))
);

// Aggregation query
const { data: stats } = useLiveQuery((q) =>
  q
    .from({ todo: todoCollection })
    .groupBy(({ todo }) => todo.priority)
    .select(({ todo }) => ({
      priority: todo.priority,
      count: count(todo.id),
    }))
);
```

#### Query Operators

- Comparison: `eq`, `gt`, `gte`, `lt`, `lte`, `inArray`
- Logical: `and`, `or`, `not`
- Aggregates: `count`, `sum`, `avg`, `min`, `max`
- String: `upper`, `lower`, `length`, `concat`

## File Structure

```
lib/
  tanstack-db/
    collections/
      todo-collection.ts    # Todo collection definition
    index.ts                # Re-exports

hooks/
  use-todo-stats.ts         # Live query hook for dashboard stats

components/
  todos/
    todo-dashboard.tsx      # Dashboard UI component
    todos-page-content.tsx  # Updated with tabs (List | Dashboard)
```

## Implementation Steps

### Step 1: Install packages

```bash
bun add @tanstack/react-db @tanstack/query-db-collection
```

### Step 2: Create Todo Collection (`lib/tanstack-db/collections/todo-collection.ts`)

```typescript
"use client";

import { createCollection } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import type { DatabaseTables } from "@/types";

type Todo = DatabaseTables["todos"]["Row"];

export const todoCollection = createCollection<Todo>(
  queryCollectionOptions({
    queryKey: ["todos-collection"],
    queryFn: async () => {
      // This will be populated by the existing getTodos call
      // We can either:
      // 1. Call getTodos server action here
      // 2. Use a sync pattern from existing query cache
      return [];
    },
    getKey: (item) => item.id,
  })
);
```

### Step 3: Create Stats Hook (`hooks/use-todo-stats.ts`)

```typescript
"use client";

import { useLiveQuery, eq, count } from "@tanstack/react-db";
import { todoCollection } from "@/lib/tanstack-db/collections/todo-collection";

export function useTodoStats() {
  // Total count
  const { data: totalStats } = useLiveQuery((q) =>
    q.from({ todo: todoCollection }).select(({ todo }) => ({
      total: count(todo.id),
    }))
  );

  // Completed count
  const { data: completedStats } = useLiveQuery((q) =>
    q
      .from({ todo: todoCollection })
      .where(({ todo }) => eq(todo.completed, true))
      .select(({ todo }) => ({
        completed: count(todo.id),
      }))
  );

  // By priority
  const { data: priorityStats } = useLiveQuery((q) =>
    q
      .from({ todo: todoCollection })
      .groupBy(({ todo }) => todo.priority)
      .select(({ todo }) => ({
        priority: todo.priority,
        count: count(todo.id),
      }))
  );

  return {
    total: totalStats?.[0]?.total ?? 0,
    completed: completedStats?.[0]?.completed ?? 0,
    pending: (totalStats?.[0]?.total ?? 0) - (completedStats?.[0]?.completed ?? 0),
    completionRate:
      totalStats?.[0]?.total > 0
        ? Math.round(
            ((completedStats?.[0]?.completed ?? 0) / totalStats[0].total) * 100
          )
        : 0,
    byPriority: priorityStats ?? [],
  };
}
```

### Step 4: Create Dashboard Component (`components/todos/todo-dashboard.tsx`)

Stats cards showing:

- Total Tasks (number)
- Completed (number + percentage)
- Pending (number)
- High Priority (number)
- Medium Priority (number)
- Low Priority (number)
- Overdue (number, if due_date < now)

### Step 5: Add Tabs to Page

Update `todos-page-content.tsx` to include tabs:

- List (existing functionality)
- Dashboard (new)

Use shadcn Tabs component.

## Database Types Reference

From `types/database.types.ts`:

```typescript
todos: {
  Row: {
    completed: boolean
    created_at: string
    description: string | null
    due_date: string | null
    id: string
    priority: "low" | "medium" | "high" | null
    title: string
    updated_at: string
    user_id: string
  }
}
```

Existing DB function (can be used as reference):

```typescript
get_user_todo_stats: {
  Args: { user_uuid: string }
  Returns: {
    completed_todos: number
    completion_rate: number
    high_priority_todos: number
    low_priority_todos: number
    medium_priority_todos: number
    no_priority_todos: number
    overdue_todos: number
    pending_todos: number
    total_todos: number
    user_id: string
  }[]
}
```

## Key Considerations

### Data Flow

1. User loads `/oppgaver` page
2. Server component verifies auth
3. Client component fetches todos via existing TanStack Query
4. Todos are synced to TanStack DB collection
5. Dashboard uses `useLiveQuery` to compute stats reactively
6. When user creates/updates/deletes todo, stats update instantly

### Syncing Query Data to Collection

Option A: Populate collection in the query's onSuccess:

```typescript
const { data } = useQuery({
  queryKey: ["todos", userId],
  queryFn: () => getTodos(userId),
  onSuccess: (data) => {
    // Sync to collection
    data.forEach((todo) => todoCollection.insert(todo));
  },
});
```

Option B: Use the collection as the query source directly (preferred):

```typescript
const todoCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["todos", userId],
    queryFn: () => getTodos(userId).then((r) => r.data ?? []),
    getKey: (item) => item.id,
  })
);
```

### Handling User Context

The collection needs to be user-scoped. Options:

1. Create collection inside component with userId dependency
2. Filter collection data by userId in live queries
3. Pass userId to collection factory function

## Implementation Summary

### Files Created/Modified

**New Files:**
- `lib/tanstack-db/collections/todo-collection.ts` - Todo collection with queryCollectionOptions
- `lib/tanstack-db/index.ts` - Re-exports for the tanstack-db module
- `hooks/use-todo-stats.ts` - Live query hook for dashboard statistics
- `components/todos/todo-dashboard.tsx` - Dashboard UI with stats cards

**Modified Files:**
- `server/todo.actions.ts` - Added `getAllTodos()` function for collection
- `components/todos/todos-page-content.tsx` - Added tabs for List/Dashboard views

### How It Works

1. **Collection Creation (Singleton Pattern)**: `getTodoCollection(userId)` returns a singleton collection instance per user. This is critical - creating new collection instances would break live query reactivity. The collection fetches all todos via the `getAllTodos` server action.

2. **Live Query**: `useTodoStats(userId)` uses `useLiveQuery` to subscribe to the collection. When any todo changes (via query invalidation), the stats recompute automatically.

3. **Dashboard UI**: Shows stats cards with:
   - TanStack DB info box (collapsible) explaining the technology
   - Total, Completed, Pending, Overdue counts
   - Completion rate progress bar
   - Priority breakdown (High/Medium/Low/None)
   - Due today count

4. **Tabbed Navigation**: Users can switch between List (existing) and Dashboard (new) views.

### Important Implementation Notes

**Singleton Pattern**: The collection MUST be a singleton per userId. If you create new collection instances on each component mount, the live queries won't receive updates from query invalidation. The `getTodoCollection(userId)` function uses a Map cache to ensure the same instance is returned.

**staleTime: 0**: Setting `staleTime: 0` ensures the collection refetches when the query is invalidated, rather than serving stale cached data.

### Key TanStack DB Concepts Demonstrated

- **Collections**: Typed containers for normalized data
- **Live Queries**: Reactive queries that update when data changes
- **Integration with TanStack Query**: Uses queryCollectionOptions to sync with server

## Testing Checklist

- [ ] Dashboard shows correct total count
- [ ] Completed/pending counts match actual data
- [ ] Priority breakdown is accurate
- [ ] Stats update immediately when todo is created
- [ ] Stats update immediately when todo is completed/uncompleted
- [ ] Stats update immediately when todo is deleted
- [ ] Stats update immediately when todo priority changes
- [x] No TypeScript errors
- [ ] Works in both light and dark mode

## Sources

- [TanStack DB Overview](https://tanstack.com/db/latest/docs/overview)
- [TanStack DB Quick Start](https://tanstack.com/db/latest/docs/quick-start)
- [Live Queries Guide](https://tanstack.com/db/latest/docs/guides/live-queries)
- [LogRocket TanStack DB Tutorial](https://blog.logrocket.com/tanstack-db-ux/)
