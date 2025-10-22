---
name: documentation-standards
description: Document new features and updates following the project documentation standards. Use when creating or updating documentation for features, significant refactors, or complex business logic. Ensures proper separation of business and technical documentation with consistent formatting.
---

# Documentation Standards

Create and maintain comprehensive documentation for features following the project's established standards for business and technical documentation.

## Overview

All significant features and changes in the project must be documented in the `docs/` directory. Documentation is split into two categories:

- **Business Documentation** (`docs/business/`) - User-facing features, workflows, and business logic
- **Technical Documentation** (`docs/technical/`) - Implementation details, architecture, and developer guidance

## When to Create Documentation

Document in these scenarios:

1. **New Features** - Any user-facing functionality or significant capability
2. **Significant Refactors** - Major architecture or implementation changes
3. **Complex Business Logic** - Non-obvious rules, validations, or workflows
4. **API Changes** - New endpoints or modified server actions
5. **Database Schema Changes** - New tables, significant column additions, or relationship changes
6. **Integration Points** - Connections with external services or other features

## Documentation Workflow

### Step 1: Determine Documentation Type

Ask these questions:

- **Does this affect users or business processes?** → Business documentation
- **Does this involve implementation details?** → Technical documentation
- **Both?** → Create both documents

### Step 2: Choose Between Create or Update

**Create new documentation** when:

- Adding a completely new feature
- Feature has no existing documentation
- Existing doc is for a different feature

**Update existing documentation** when:

- Enhancing existing feature
- Changing behavior of documented feature
- Adding capabilities to existing system
- Deprecating or removing functionality

### Step 3: Create Business Documentation

**Location**: `docs/business/[feature-name].md`

**Audience**: Product managers, stakeholders, customer support

**Required Sections**:

1. **Overview** - What the feature is (1-2 paragraphs)
2. **Business Purpose** - Problem, solution, value
3. **User Workflows** - Step-by-step user journeys
4. **Business Rules** - Validation, access control, constraints
5. **Integration Points** - How feature connects with others
6. **Success Metrics** - KPIs and measurement approach
7. **Future Enhancements** - Planned improvements

**File Naming**: Use kebab-case: `todo-management.md`, `user-authentication.md`

### Step 4: Create Technical Documentation

**Location**: `docs/technical/[feature-name]-implementation.md` or `docs/technical/[topic].md`

**Audience**: Developers, DevOps, technical stakeholders

**Required Sections**:

1. **Architecture Overview** - High-level design
2. **Database Schema** - Tables, indexes, RLS policies
3. **API Endpoints** - Server actions and API routes
4. **Client Components** - Key React components
5. **Data Flow** - Step-by-step operation flows
6. **Performance Considerations** - Optimization notes
7. **Security Implementation** - Auth, validation, RLS
8. **Testing Strategy** - How to test the feature
9. **Deployment Notes** - Environment variables, migrations, rollback
10. **Monitoring** - Metrics, logging, error tracking

**File Naming**: Use kebab-case with `-implementation` suffix for features: `todo-implementation.md`

For detailed template, refer to `references/templates.md`.

### Step 5: Update Existing Documentation

When updating existing docs, **integrate new information** rather than appending.

**Principles**:

- **Merge, don't duplicate** - Update existing sections with new info
- **Preserve context** - Keep relevant old information
- **Mark changes** - Use version markers for significant updates
- **Deprecation** - Strike through old content, note when deprecated

**Example - Updating a workflow**:

```markdown
## Create Todo Workflow

**Current (v2.0+)**:

1. User navigates to `/oppgaver`
2. Clicks "Create Todo" button
3. Fills form with title, priority, and tags (new in v2.0)
4. Submits form

**Previous (v1.x)**:

<details>
<summary>Original workflow without tags</summary>

1. User navigates to `/oppgaver`
2. Clicks "Create Todo"
3. Fills form with title and priority only
</details>
```

**Example - Updating API documentation**:

````markdown
#### `createTodo(data)`

**Parameters** (Updated v2.0):

```typescript
{
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  tags?: string[]; // Added in v2.0
}
```
````

**Changes in v2.0**:

- Added `tags` parameter for categorization
- Validation updated to accept string arrays

````

For complete updating patterns, refer to `references/templates.md`.

## Documentation Quality Standards

### Clear and Concise

- Use simple language
- Avoid jargon unless necessary (then define it)
- One concept per paragraph
- Short sentences (prefer <25 words)

### Structured and Scannable

- Use headings hierarchy (h2 → h3 → h4)
- Bullet points for lists
- Code blocks with syntax highlighting
- Tables for comparisons
- Examples for clarity

### Complete and Accurate

- Include all required sections
- Provide working code examples
- Show both success and error cases
- Link to related documentation
- Keep synchronized with code

### Maintained and Current

- Update when code changes
- Add version markers for updates
- Document deprecations clearly
- Include document history section

## Code Examples in Documentation

### Use Real, Working Code

**Good** - Actual code from the project:
```typescript
const { data: todos } = useQuery({
  queryKey: ["todos"],
  queryFn: async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("todos")
      .select("*");
    return data;
  },
});
````

**Avoid** - Pseudocode or simplified examples:

```typescript
// ❌ Too simplified
const todos = await getTodos();
```

### Include Context

Show imports, types, and necessary context:

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createTodo } from "@/server/todos.actions";

const mutation = useMutation({
  mutationFn: createTodo,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["todos"] });
    toast.success("Todo created");
  },
});
```

### Highlight Key Parts

Add comments to explain important lines:

```typescript
const { data } = await supabase
  .from("todos")
  .select("*")
  .eq("user_id", userId) // RLS automatically filters, but explicit for clarity
  .order("created_at", { ascending: false });
```

## Related Documentation

- [Project CLAUDE.md](/CLAUDE.md) - Full project guidelines
- [Database Schema Extension Skill](/.claude/skills/database-schema-extension/SKILL.md) - For database documentation
- Existing docs in `docs/business/` and `docs/technical/` - Examples to follow
