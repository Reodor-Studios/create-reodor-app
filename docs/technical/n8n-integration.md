# n8n Workflow Integration

## Overview

This guide explains when and how to use n8n workflow automation alongside Next.js Server Actions. While Server Actions should be your default choice for backend logic, n8n excels at orchestrating complex multi-step workflows, AI agent pipelines, and external service integrations.

The organization maintains an n8n instance at `https://n8n.reodorstudios.com` with comprehensive MCP (Model Context Protocol) integration for AI-assisted workflow development.

## When to Use Each Approach

### ✅ Use Next.js Server Actions When

- **Standard CRUD Operations** - Database create, read, update, delete with RLS
- **Simple Business Logic** - Authentication, authorization, data validation
- **Form Handling** - User input processing with React Hook Form + Zod
- **Single API Calls** - Straightforward external service integration
- **Type Safety Critical** - Need end-to-end TypeScript type checking
- **Fast Response Required** - Operations must complete in <5 seconds
- **Tight Frontend Integration** - Data needs direct use in React components

**Why Server Actions**: Excellent developer experience, full type safety from database → frontend, tight React integration, and fast response times.

### ⚠️ Consider n8n Workflows When

#### 1. Complex Multi-Step Workflows 🔄

**Problem with Server Actions:**
- Code becomes difficult to read and maintain with 5+ sequential steps
- Error handling at each step creates nested try-catch blocks
- Hard to visualize the flow and debug issues
- Changes require code deployments

**n8n Benefits:**
- Visual workflow designer makes flow clear and debuggable
- Built-in error handling per node with automatic retry logic
- Live execution view shows data at each step
- Non-developers can understand and modify workflows
- Changes deploy instantly without code releases

**Example Use Cases:**
- Order processing with inventory checks, payment, fulfillment, and notifications
- Content publishing pipelines with approval workflows
- Multi-stage data transformations with conditional branching

#### 2. AI Agent Pipelines 🤖

**Problem with Server Actions:**
- Multiple AI API calls create complex async logic
- Tool use and decision trees lead to deeply nested code
- Prompt engineering changes require code deployments
- Difficult to implement retry logic for AI failures

**n8n Benefits:**
- Pre-built AI nodes (OpenAI, Anthropic, Hugging Face)
- Visual representation of agent decision trees
- Easy prompt iteration without code changes
- Built-in retry and fallback logic
- Execution logs show AI responses at each step

**Example Use Cases:**
- Content generation pipelines (research → outline → draft → review)
- Customer support automation with AI classification and routing
- Data enrichment with AI analysis and categorization

#### 3. External Service Orchestration 🔗

**Problem with Server Actions:**
- Coordinating 3+ external APIs requires complex error handling
- Rate limiting and retry logic must be implemented manually
- Authentication management for multiple services
- Difficult to handle service downtime gracefully

**n8n Benefits:**
- 400+ pre-built integrations with authentication handling
- Built-in rate limiting and retry mechanisms
- Visual debugging of external API responses
- Easy to add fallback services or alternative flows

**Example Use Cases:**
- Notion → AI processing → Slack → Database → Email
- Calendar sync across multiple platforms
- Social media cross-posting with platform-specific formatting

#### 4. Long-Running Tasks ⏱️

**Problem with Server Actions:**
- Serverless function timeout limits (even with Vercel Fluid Compute: 1 min free, 14 min paid)
- No progress tracking for lengthy operations
- Cannot implement pause/resume functionality
- Difficult to handle partial failures in long processes

**n8n Benefits:**
- No timeout restrictions for workflow execution
- Progress tracking built into execution view
- Can implement wait times between steps
- Easy partial failure recovery with manual resume

**Example Use Cases:**
- Batch data processing (CSV imports, mass updates)
- Video/audio transcoding and processing
- Scheduled report generation with multiple data sources
- Overnight sync operations

#### 5. Scheduled Automation 📅

**Problem with Server Actions:**
- Need separate cron job infrastructure
- Complex scheduling logic (business hours, holidays, retry windows)
- Monitoring and alerting requires additional setup

**n8n Benefits:**
- Built-in cron scheduling with visual editor
- Complex schedule patterns (weekdays only, specific hours)
- Execution history and monitoring included
- Automatic failure notifications

**Example Use Cases:**
- Daily/weekly report generation
- Scheduled data backups and exports
- Periodic data synchronization between services
- Reminder and notification systems

## Architecture Patterns

### Pattern 1: Pure Server Actions

For simple, fast operations that need type safety:

```typescript
// server/profile.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export async function updateProfile(data: ProfileUpdate) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized", data: null };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return { error: error.message, data: null };
  }

  return { error: null, data: profile };
}
```

### Pattern 2: Pure n8n Workflow

For complex orchestration best handled entirely in n8n:

```
Workflow: Process Newsletter
Trigger: Cron (Every Monday 9 AM)
  ↓
1. Fetch new blog posts (Supabase node)
   Fields: title, content, published_at
   Filter: published_at > last_week
  ↓
2. Generate newsletter content (OpenAI node)
   Prompt: Summarize posts, add intro/outro
   Model: gpt-4
  ↓
3. Fetch subscribers (Supabase node)
   Filter: subscribed = true AND verified = true
  ↓
4. Split into batches (Split In Batches node)
   Batch size: 100 (rate limit compliance)
  ↓
5. Send emails (Resend node)
   Template: newsletter-template
   Track opens/clicks: true
  ↓
6. Update sent count (Supabase node)
   Table: newsletter_stats
   Fields: sent_count, sent_at
  ↓
7. Notify admin (Slack node)
   Message: "Newsletter sent to X subscribers"
```

### Pattern 3: Hybrid Approach (Server Action → n8n)

For operations that start in the app but need complex processing:

```typescript
// server/order.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

interface N8nWebhookResponse<T = any> {
  status: "success" | "error";
  data?: T;
  error?: string;
}

async function triggerN8nWorkflow<T = any>(
  workflowPath: string,
  data: any
): Promise<N8nWebhookResponse<T>> {
  try {
    const response = await fetch(
      `${env.N8N_WEBHOOK_URL}/${workflowPath}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.N8N_WEBHOOK_SECRET}`,
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error(`n8n workflow failed: ${response.statusText}`);
    }

    const result = await response.json();
    return { status: "success", data: result };
  } catch (error) {
    console.error("n8n workflow error:", error);
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function processOrder(orderId: string) {
  const supabase = await createClient();

  // 1. Validate order in database (Server Action)
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return { error: "Order not found", data: null };
  }

  // 2. Trigger complex processing in n8n
  const result = await triggerN8nWorkflow("process-order", {
    orderId,
    orderData: order,
  });

  if (result.status === "error") {
    return { error: result.error, data: null };
  }

  // 3. Update order status (Server Action)
  const { data: updatedOrder, error: updateError } = await supabase
    .from("orders")
    .update({ status: "processing", n8n_workflow_id: result.data.workflowId })
    .eq("id", orderId)
    .select()
    .single();

  if (updateError) {
    return { error: updateError.message, data: null };
  }

  return { error: null, data: updatedOrder };
}
```

**n8n Workflow (process-order):**
```
Webhook Trigger: process-order
  ↓
1. Check inventory (HTTP Request → Inventory API)
   If out of stock → Send notification → Error exit
  ↓
2. Process payment (HTTP Request → Payment Gateway)
   Retry: 3 times with 5s delay
   If failed → Refund → Error notification → Error exit
  ↓
3. Create shipment (HTTP Request → Shipping API)
   Get tracking number
  ↓
4. Send confirmation email (Resend node)
   Include: Order details, tracking number
  ↓
5. Update external systems (Parallel branches)
   - Analytics (PostHog)
   - CRM (HubSpot)
   - Accounting (QuickBooks)
  ↓
6. Respond to webhook
   Return: { workflowId, status, trackingNumber }
```

## Environment Configuration

Add n8n configuration to your environment variables:

```typescript
// lib/env.ts
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // ... existing vars

    // n8n Configuration
    N8N_WEBHOOK_URL: z.string().url().optional(),
    N8N_WEBHOOK_SECRET: z.string().optional(),
  },

  client: {
    // ... client vars
  },

  runtimeEnv: {
    // ... other env vars
    N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL,
    N8N_WEBHOOK_SECRET: process.env.N8N_WEBHOOK_SECRET,
  },
});
```

```bash
# .env.local
N8N_WEBHOOK_URL=https://n8n.reodorstudios.com/webhook
N8N_WEBHOOK_SECRET=your-webhook-secret-here
```

```bash
# .env.production
N8N_WEBHOOK_URL=https://n8n.reodorstudios.com/webhook
N8N_WEBHOOK_SECRET=your-production-webhook-secret
```

## n8n Workflow Development

### Repository Structure

The organization maintains a separate n8n repository:

```
/Users/magnusrodseth/dev/capra/reodor-studios/n8n/
├── .claude/
│   └── settings.local.json   # Claude Code configuration
├── workflows/                # Version-controlled workflows
│   ├── process-order.json
│   ├── send-newsletter.json
│   └── README.md
├── .mcp.json                 # n8n-mcp server config (not committed)
├── CLAUDE.md                 # AI development instructions
└── README.md                 # Setup and usage guide
```

### Development Workflow

1. **Design in Code**
   - Describe workflow requirements to Claude Code
   - Claude uses n8n-mcp tools to search nodes and get documentation
   - Generates workflow JSON with proper configuration

2. **Validate**
   - Use `validate_workflow` MCP tool with appropriate profile
   - Fix any validation errors
   - Ensure all required properties are set

3. **Deploy**
   - Use `create_workflow` MCP tool to deploy to n8n instance
   - Or manually import JSON in n8n UI

4. **Test**
   - Execute workflow in n8n with test data
   - Review execution logs and data flow
   - Verify external service integrations

5. **Version Control**
   - Save workflow JSON to `n8n/workflows/` directory
   - Commit with descriptive message
   - Document workflow purpose and usage

### Available MCP Tools

When working with n8n, Claude Code has access to:

- **search_nodes** - Find n8n nodes by functionality
- **get_node_info** - Detailed node documentation
- **get_node_essentials** - Minimal config for operations
- **search_templates** - Find example workflows
- **get_template** - Get complete template JSON
- **validate_workflow** - Check workflow before deployment
- **create_workflow** - Deploy to n8n instance
- **list_workflows** - View deployed workflows
- **execute_workflow** - Trigger workflow execution

### Specialized Skills

The n8n repository includes 7 skills that automatically activate:

1. **n8n-expression-syntax** - Expression patterns and gotchas
2. **n8n-mcp-tools-expert** - MCP tool usage guidance
3. **n8n-workflow-patterns** - Proven architectures
4. **n8n-validation-expert** - Error fixing
5. **n8n-node-configuration** - Node setup
6. **n8n-code-javascript** - JavaScript code node patterns
7. **n8n-code-python** - Python code node patterns

## Real-World Examples

### Example 1: User Onboarding Sequence

**Server Action** for initial signup:

```typescript
// server/auth.actions.ts
export async function createUser(data: SignupData) {
  const supabase = await createClient();

  // Create user account
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });

  if (authError) {
    return { error: authError.message, data: null };
  }

  // Create profile
  const { error: profileError } = await supabase
    .from("profiles")
    .insert({
      user_id: authData.user.id,
      full_name: data.fullName,
    });

  if (profileError) {
    return { error: profileError.message, data: null };
  }

  // Trigger onboarding workflow
  await triggerN8nWorkflow("user-onboarding", {
    userId: authData.user.id,
    email: data.email,
    fullName: data.fullName,
  });

  return { error: null, data: authData.user };
}
```

**n8n Workflow** for onboarding emails:

```
Webhook: user-onboarding
  ↓
1. Send welcome email (immediate)
   Template: welcome
   Include: Getting started guide link
  ↓
2. Wait 1 hour
  ↓
3. Check if user logged in (Supabase query)
   If yes → Skip to step 6
   If no → Continue
  ↓
4. Send reminder email
   Template: login-reminder
   CTA: Complete profile setup
  ↓
5. Wait 24 hours
  ↓
6. Check activity level (Supabase query)
   Calculate: logins, features used
  ↓
7. Branch based on activity
   Active user → Send feature tips email
   Inactive user → Send re-engagement email
  ↓
8. Wait 3 days
  ↓
9. Send feature guide email
   Personalized based on usage patterns
```

### Example 2: Content Publishing Pipeline

**Server Action** for draft creation:

```typescript
// server/content.actions.ts
export async function createDraft(data: ContentDraft) {
  const supabase = await createClient();

  const { data: draft, error } = await supabase
    .from("content")
    .insert({
      ...data,
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    return { error: error.message, data: null };
  }

  return { error: null, data: draft };
}

export async function publishContent(contentId: string) {
  const supabase = await createClient();

  // Get content
  const { data: content, error: fetchError } = await supabase
    .from("content")
    .select("*")
    .eq("id", contentId)
    .single();

  if (fetchError) {
    return { error: fetchError.message, data: null };
  }

  // Trigger publishing workflow
  const result = await triggerN8nWorkflow("publish-content", {
    contentId,
    content: content.body,
    title: content.title,
  });

  if (result.status === "error") {
    return { error: result.error, data: null };
  }

  // Update status
  const { data: published, error: updateError } = await supabase
    .from("content")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", contentId)
    .select()
    .single();

  if (updateError) {
    return { error: updateError.message, data: null };
  }

  return { error: null, data: published };
}
```

**n8n Workflow** for publishing:

```
Webhook: publish-content
  ↓
1. Generate social media posts (AI)
   Input: content.body
   Output: Twitter, LinkedIn, Facebook versions
  ↓
2. Generate meta descriptions (AI)
   For SEO optimization
  ↓
3. Parallel publishing branches:
   ├─ Post to blog (Update Supabase)
   ├─ Tweet thread (Twitter API)
   ├─ LinkedIn article (LinkedIn API)
   ├─ Facebook post (Facebook API)
   └─ Send to newsletter list (Resend)
  ↓
4. Wait for all branches to complete
  ↓
5. Generate analytics report
   Combine: URLs, post IDs, timestamps
  ↓
6. Notify author (Email + Slack)
   Include: Published URLs, analytics dashboard link
  ↓
7. Respond to webhook
   Return: Publication status, URLs
```

## Testing and Debugging

### Testing Server Actions

Standard approach with error handling:

```typescript
// In React component
const mutation = useMutation({
  mutationFn: processOrder,
  onSuccess: (result) => {
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Order processed successfully");
    router.push(`/orders/${result.data.id}`);
  },
  onError: (error) => {
    toast.error("Failed to process order");
    console.error(error);
  },
});
```

### Testing n8n Webhooks Locally

```bash
# Test with curl
curl -X POST \
  https://n8n.reodorstudios.com/webhook/process-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${N8N_WEBHOOK_SECRET}" \
  -d '{
    "orderId": "test-123",
    "orderData": {
      "items": [{"id": "item-1", "quantity": 2}],
      "total": 99.99
    }
  }'
```

### Debugging n8n Workflows

1. **Execution View** - Shows data at each node
2. **Error Logs** - Detailed error messages and stack traces
3. **Manual Execution** - Test with sample data
4. **Expression Testing** - Test expressions in node config
5. **Webhook Testing** - Built-in webhook tester

## Migration Strategies

### From Server Actions to n8n

Consider migration when:

- Server action exceeds 200 lines
- Multiple external API calls with complex error handling
- Need visual debugging of multi-step process
- Non-developers need to modify workflow
- Adding scheduling/cron requirements

**Migration Steps:**

1. Document current server action flow
2. Design equivalent n8n workflow
3. Build and test workflow in n8n
4. Create hybrid approach (action → webhook)
5. Deploy and monitor
6. Remove old server action code

### From n8n to Server Actions

Consider migration when:

- Workflow is too simple (1-2 steps)
- Type safety becomes critical
- Performance is critical (<100ms needed)
- Workflow never changes
- Can replace external services with direct API calls

**Migration Steps:**

1. Export workflow execution logs for test cases
2. Implement equivalent server action with types
3. Add comprehensive tests
4. Deploy with feature flag
5. Gradual rollout with monitoring
6. Deactivate n8n workflow

## Best Practices

### DO:

✅ **Default to server actions** for standard features
✅ **Use n8n for complex orchestration** (5+ steps)
✅ **Document workflows** in both code and n8n descriptions
✅ **Secure webhooks** with authentication tokens
✅ **Version control** n8n workflow JSON files
✅ **Test thoroughly** before production deployment
✅ **Monitor executions** and set up failure alerts
✅ **Handle webhook failures** gracefully in server actions
✅ **Use environment variables** for n8n URLs/secrets
✅ **Keep workflows focused** on one primary task

### DON'T:

❌ **Don't use n8n** for simple CRUD operations
❌ **Don't skip validation** when calling webhooks
❌ **Don't hardcode secrets** in workflow configs
❌ **Don't deploy untested** workflows to production
❌ **Don't ignore execution failures** silently
❌ **Don't build complex AI** agents in server actions (use n8n)
❌ **Don't couple workflows** too tightly to implementation
❌ **Don't forget error handling** at each workflow node
❌ **Don't skip documentation** for complex workflows

## Security Considerations

### Webhook Authentication

Always authenticate n8n webhook calls:

```typescript
// server/workflow.actions.ts
async function triggerN8nWorkflow(path: string, data: any) {
  const response = await fetch(`${env.N8N_WEBHOOK_URL}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.N8N_WEBHOOK_SECRET}`,
    },
    body: JSON.stringify(data),
  });
  // ... handle response
}
```

### n8n Workflow Security

- Use environment variables for API keys
- Enable webhook authentication in n8n
- Validate input data in workflow
- Limit workflow execution permissions
- Log security-relevant events
- Rotate secrets regularly

### Data Privacy

- Don't send PII to n8n unless necessary
- Use encrypted connections (HTTPS)
- Implement data retention policies
- Comply with GDPR/privacy regulations
- Audit workflow data access

## Performance Considerations

### Server Actions

- **Pros**: Fast (<100ms typical), low latency
- **Cons**: Timeout limits, no background processing
- **Best for**: Real-time user interactions

### n8n Workflows

- **Pros**: No timeout, handles long-running tasks
- **Cons**: Network latency for webhook calls (+50-200ms)
- **Best for**: Complex orchestration, background jobs

### Optimization Tips

1. **Minimize webhook calls** - Batch operations when possible
2. **Use async execution** - Don't wait for non-critical workflows
3. **Cache responses** - For frequently accessed workflow data
4. **Monitor performance** - Track workflow execution times
5. **Scale appropriately** - n8n instance resources for workload

## Summary

**Default Choice**: Next.js Server Actions for standard features

**Use n8n When**:
- Complex multi-step workflows (5+ steps)
- AI agent pipelines with decision trees
- External service orchestration (3+ APIs)
- Long-running tasks (>10 seconds)
- Scheduled automation with complex logic

**Integration Options**:
1. Pure server actions (most features)
2. Pure n8n workflows (complex orchestration)
3. Hybrid approach (action → webhook → action)

**Development Resources**:
- n8n instance: `https://n8n.reodorstudios.com`
- n8n repository: `/Users/magnusrodseth/dev/capra/reodor-studios/n8n/`
- Claude skill: `.claude/skills/n8n-integration-patterns/`
- MCP tools: Available in n8n repository via `n8n-mcp`

For AI-assisted n8n workflow development, work in the n8n repository where specialized skills and MCP tools are configured.
