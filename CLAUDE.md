# create-reodor-app

## Project Overview

**create-reodor-app** is a comprehensive Next.js starter template designed to accelerate fullstack web application development. It provides a production-ready foundation with modern tooling, best practices, and essential integrations pre-configured.

### Purpose

This is a **scaffold project** intended to be cloned and customized for new applications. The template includes working examples (like the todo CRUD feature) that demonstrate the architecture patterns, but these are meant to be **removed and replaced** with your actual application features.

### Key Features

#### 1. Landing Page (`app/page.tsx`)

- **Setup Steps Interface**: Interactive checklist demonstrating Zustand state management
  - Progress tracking with visual indicators
  - Category-based organization (Getting Started, Database, Services, Deployment)
  - localStorage persistence (survives browser sessions)
  - Smooth BlurFade animations throughout

The landing page serves as both a welcome screen and a practical demonstration of state management patterns used throughout the application.

#### 2. Authentication System

- **Sign Up / Sign In**: Email/OTP and Google OAuth via Supabase Auth
- **Protected Routes**: Middleware-based authentication checks
- **Profile Management**: User profiles with automatic creation on signup
- **Role-Based Access**: Support for User and Admin roles
- **Session Management**: Secure session handling with Supabase

#### 3. Todo CRUD Example (`app/oppgaver/page.tsx`)

The todos feature is a **reference implementation** demonstrating:

- **Authentication**: Server-side auth checks in React Server Components
- **Data Fetching**: TanStack Query for client-side data management
- **CRUD Operations**: Full create, read, update, delete functionality
- **Server Actions**: Pattern for secure server-side operations
- **Form Handling**: React Hook Form + Zod validation
- **Real-time Updates**: Query invalidation and optimistic updates
- **Row Level Security**: Users can only access their own todos

**Important**: This todo example should be removed once you understand the patterns and are ready to build your own features.

#### 4. Profile Pages (`app/profiler/[profileId]/`)

- Dynamic profile routing
- User profile viewing and editing
- Example of Next.js dynamic routes and layouts

### Getting Started with the Template

1. **Explore the Examples**:

   - Study the landing page (`app/page.tsx`) for Zustand state management patterns
   - Review the todos feature (`app/oppgaver/`) for complete CRUD implementation
   - Examine server actions (`server/todos.actions.ts`) for data mutation patterns
   - Check database schemas (`supabase/schemas/`) for RLS and schema organization

2. **Build Your Application**:

   - Remove the todo example feature once understood
   - Create your own database tables in `supabase/schemas/`
   - Generate migrations with `bun db:diff`
   - Build new features following the established patterns
   - Update the landing page with your application's content

3. **Customize**:
   - Update branding in `lib/brand.ts`
   - Modify color schemes in `globals.css`
   - Replace placeholder content with your application's features
   - Add your own documentation to `docs/`

### What's Included Out-of-the-Box

- Complete authentication flow with Supabase
- Database schema migration system
- Type-safe API layer with generated types
- Form validation with Zod
- State management with Zustand
- Server-side rendering and client-side hydration
- Responsive UI components (shadcn/ui, Kibo UI, Magic UI)
- Email templates with React Email
- Analytics integration (PostHog)
- Deployment configuration (Railway)

### Development Philosophy

This template follows these principles:

- **Type Safety First**: Leverage TypeScript and generated database types
- **Server-First Data Fetching**: Use sensible data fetching patterns, both server-side and client-side
- **Security by Default**: Row Level Security (RLS) enabled on all tables
- **Developer Experience**: Fast refresh, type checking, and comprehensive tooling

## Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety throughout the application
- **Tailwind CSS** - Utility-first CSS framework

### UI Libraries

- **shadcn/ui** - Primary component library
- **Kibo UI** - Additional specialized components
- **Magic UI** - Enhanced UI components
- **Mina Scheduler** - Calendar and booking system (<https://github.com/Mina-Massoud/mina-scheduler>).

### State Management & Data Fetching

- **Zustand** - Global state management with session storage persistence
- **TanStack Query** - Server state management and caching
- **React Hook Form** - Form handling with Zod validation

### Backend & Database

- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication system
  - Real-time subscriptions
  - File storage
  - Row Level Security (RLS)
- **Supabase Edge Functions** - Serverless functions (Deno runtime)

### External Services

- **Stripe** - Payment processing with Supabase Stripe Sync Engine
- **Resend** - Transactional email delivery
- **React Email** - Email template system
- **Mapbox** - Address autocomplete and geographical features
- **PostHog** - Analytics and error tracking
- **Brevo** - Newsletter management
- **Vercel** - Hosting and deployment

### Development Tools

- **Bun** - Package manager and runtime
- **Supazod** - Generate Zod schemas from Supabase types
- **ESLint** - Code linting
- **Supabase CLI** - Database management and migrations

## Code Conventions

### TypeScript Standards

- Use strict TypeScript configuration
- Prefer explicit type annotations for function parameters and return types
- Prefer function parameters as object `({p1, p2, p3})` instead of named parameters `(p1, p2, p3)`.
- Use type imports: `import type { ... } from '...'`
- Leverage generated database types from `types/database.types.ts`
- Use Zod schemas from `schemas/database.schema.ts` for validation
- Prefer to **infer** types from database instead of typing it. Example: `type Booking = DatabaseTables["bookings"]["Update"]` or `z.infer<typeof BookingStatusSchema>`

### Shared Filter Types Rule

- **Filter Type Location**: When client-side filters are saved in URL parameters AND used in server actions, store the shared filter types in `types/index.ts` (runtime-agnostic location)
- **Type Consistency**: Both client components and server actions must import from the same centralized type definition
- **Utility Functions**: Include URL parameter conversion utilities alongside the filter types
- **Examples**: `BookingFilters`, `ServiceFilters` with corresponding `searchParamsTo[FilterName]` and `[filterName]ToSearchParams` functions

### Naming Conventions

- Use camelCase for variables and functions
- Use PascalCase for components and types
- Use kebab-case for file names
- Use SCREAMING_SNAKE_CASE for constants
- Prefix custom hooks with `use`
- Suffix Zustand stores with `Store`

### Component Patterns

```typescript
// Prefer explicit prop types
interface ComponentProps {
  title: string;
  isVisible?: boolean;
  onAction: () => void;
}

export const Component = ({
  title,
  isVisible = false,
  onAction,
}: ComponentProps) => {
  // Component implementation
};
```

## Data Flow Architecture

### Client-Server Communication

- **Public pages** (landing, etc.): Server-side data fetching for SEO
- **Protected pages** (dashboard, etc.): Do server-side auth checks in React Server Component in the page, then client-side data fetching with TanStack Query for the actual data.
- **Real-time features**: Supabase real-time subscriptions. Refer to the documentation here: <https://supabase.com/docs/guides/realtime/broadcast>
- **Forms**: React Hook Form + Zod validation + TanStack Query mutations

### Server Actions Pattern

All server actions follow this structure with individual exported async functions:

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { [tableName]InsertSchema } from "@/schemas/database.schema";

export async function get[EntityName](id: string) {
  const supabase = await createClient();
  return await supabase.from("[table]").select("*").eq("id", id);
}

export async function create[EntityName](data: Database["public"]["Tables"]["[table]"]["Insert"]) {
  const { success, data: validatedData } = [tableName]InsertSchema.safeParse(data);
  if (!success) {
    return { error: "Invalid data", data: null };
  }

  const supabase = await createClient();
  return await supabase.from("[table]").insert(validatedData);
}
```

### Form Handling Pattern

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

const form = useForm({
  resolver: zodResolver(schemaFromDatabase),
});

const mutation = useMutation({
  mutationFn: serverAction,
  onSuccess: () => toast.success("Success message"),
  onError: () => toast.error("Error message"),
});
```

## Database Management

### Schema Organization

- **Declarative schemas**: Define desired state in `supabase/schemas/`
- **Generated migrations**: Use `bun db:diff` to create migrations
- **Apply migration**: Use `bun migrate:up` to apply newly created migration after `db:diff`, but first ensure you have reviewed the generated SQL
- **Type generation**: `bun gen:types` generates TypeScript types and Zod schemas

### Row Level Security (RLS)

- All tables have RLS policies defined in `supabase/schemas/02-policies.sql`
- Users can only access their own data unless explicitly granted
- Admin users have elevated permissions for management operations

## File Structure

```text
create-reodor-app/
├── app/                    # Next.js app router pages
│   ├── auth/              # Authentication pages
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   │   └── kibo-ui/      # Kibo UI components
│   └── [feature]/        # Feature-specific components
├── docs/                 # Project documentation
│   ├── business/         # Business feature documentation
│   └── technical/        # Technical implementation docs
├── hooks/                # Custom React hooks
├── lib/                  # External service configurations
│   └── supabase/         # Supabase client configuration
├── providers/            # React context providers
├── schemas/              # Generated Zod schemas
├── scripts/              # Utility scripts
├── server/               # Server actions
├── stores/               # Zustand stores
├── supabase/             # Supabase configuration
│   ├── schemas/          # Declarative database schemas
│   ├── migrations/       # Generated SQL migrations
│   └── functions/        # Edge functions
├── transactional/        # React Email templates
└── types/                # TypeScript type definitions
```

## UI Component Patterns

### Component Library Priority

1. **shadcn/ui** - Primary choice for standard components. Documentation: <https://ui.shadcn.com/>
2. **Kibo UI** - Specialized components not in shadcn/ui. Documentation: <https://www.kibo-ui.com/>
3. **Magic UI** - Enhanced animations and effects. Documentation: <https://magicui.design/>
4. **React Bits** - For creative backgrounds. Documentation: <https://reactbits.dev/>.
5. **Custom components** - When existing libraries don't meet needs

### Styling Conventions

- Use semantic color classes: `primary`, `secondary`, `accent` instead of literal colors
- Leverage Tailwind's design system
- Use `cn()` utility for conditional classes. Refer to `lib/utils.ts`.
- Prefer composition over customization for component variants

### Color Pattern Standards

Always respect light and dark mode when using colors. Use Tailwind's color system with appropriate dark mode variants.

#### Color Usage Pattern

```tsx
// ✅ CORRECT - Respects both light and dark mode
<div className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
  <p className="text-green-800 dark:text-green-200">Success message</p>
</div>

// ❌ INCORRECT - No dark mode support
<div className="bg-green-50 border-green-200">
  <p className="text-green-800">Success message</p>
</div>
```

#### Standard Color Combinations

| Color  | Light Background | Dark Background         | Light Border        | Dark Border              | Light Text        | Dark Text              |
| ------ | ---------------- | ----------------------- | ------------------- | ------------------------ | ----------------- | ---------------------- |
| Green  | `bg-green-50`    | `dark:bg-green-950/30`  | `border-green-200`  | `dark:border-green-800`  | `text-green-800`  | `dark:text-green-200`  |
| Red    | `bg-red-50`      | `dark:bg-red-950/30`    | `border-red-200`    | `dark:border-red-800`    | `text-red-800`    | `dark:text-red-200`    |
| Blue   | `bg-blue-50`     | `dark:bg-blue-950/30`   | `border-blue-200`   | `dark:border-blue-800`   | `text-blue-800`   | `dark:text-blue-200`   |
| Purple | `bg-purple-50`   | `dark:bg-purple-950/30` | `border-purple-200` | `dark:border-purple-800` | `text-purple-800` | `dark:text-purple-200` |
| Amber  | `bg-amber-50`    | `dark:bg-amber-950/30`  | `border-amber-200`  | `dark:border-amber-800`  | `text-amber-800`  | `dark:text-amber-200`  |
| Yellow | `bg-yellow-50`   | `dark:bg-yellow-950/30` | `border-yellow-200` | `dark:border-yellow-800` | `text-yellow-800` | `dark:text-yellow-200` |

#### Real-World Examples

```tsx
// Success notification
<div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
  <p className="text-green-800 dark:text-green-200">Operation completed successfully</p>
</div>

// Error notification
<div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
  <p className="text-red-800 dark:text-red-200">An error occurred</p>
</div>

// Info card
<Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
  <CardHeader>
    <CardTitle className="text-blue-800 dark:text-blue-200">Information</CardTitle>
  </CardHeader>
</Card>

// Warning alert
<div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
  <p className="text-amber-900 dark:text-amber-100">Warning message</p>
</div>
```

#### Guidelines

- Always provide both light and dark mode variants
- Use `/30` opacity for dark backgrounds (e.g., `dark:bg-color-950/30`)
- Maintain sufficient contrast for accessibility
- Test color combinations in both light and dark modes
- Follow the established pattern consistently across the application

### Dialog Overflow Handling

For dialogs with long content that might exceed viewport height, use these classes on `DialogContent`:

```tsx
// For responsive dialogs with scroll capability
<DialogContent className="sm:max-w-[500px] overflow-y-scroll max-h-screen">
  {/* Dialog content */}
</DialogContent>
```

**Key Classes**:

- `overflow-y-scroll` - Enables vertical scrolling when content overflows
- `max-h-screen` - Limits dialog height to screen height
- `sm:max-w-[500px]` - Responsive width control

**When to Use**:

- Forms with many fields (like address forms)
- Dialogs with dynamic content that might grow
- Mobile-first responsive dialogs
- Any dialog where content height is unpredictable

**Alternative Approach**: For complex layouts, you can use ScrollArea component, but the overflow classes are simpler and more reliable for most use cases.

### Responsive Dialog/Drawer Pattern

For better mobile UX, implement dialogs that automatically become drawers on small screens while remaining dialogs on desktop.

**Core Pattern**:

- Use `useMediaQuery("(min-width: 768px)")` to detect screen size
- Render `Dialog` for desktop (≥768px), `Drawer` for mobile (<768px)
- Component filename remains `something-dialog.tsx`

```tsx
import { useMediaQuery } from "@/hooks/use-media-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

export function MyDialog({ open, onOpenChange, children }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>{children}</DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>{children}</DrawerContent>
    </Drawer>
  );
}
```

**When Content Needs Different Layouts**:

If your content doesn't work well in both contexts (e.g., buttons hidden in drawer), pass an `isInDrawer` prop:

```tsx
// In dialog component
const renderContent = ({ isInDrawer = false }) => (
  <MyForm isInDrawer={isInDrawer} />
);

// In form component
export function MyForm({ isInDrawer = false }) {
  if (isInDrawer) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto space-y-4 pr-4 pb-4">
          {/* Form fields */}
        </div>
        <div className="flex-shrink-0 pt-4 border-t bg-background">
          {/* Fixed bottom buttons */}
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[700px] flex-1">
      {/* Standard dialog layout */}
    </ScrollArea>
  );
}
```

**Key Guidelines**:

- Drawer height: `h-[95vh]` for near full-screen experience
- Drawer content wrapper: `flex-1 min-h-0 px-4 pb-4` for proper scrolling
- Fixed buttons in drawer: Use `flex-shrink-0 pt-4 border-t`
- Always handle `onOpenChange` consistently for both components

### Loading States

- Use `Spinner` component from `components/ui/spinner.tsx`
- Implement proper loading states with React Suspense if we're waiting for async data in a React Server Component
- Show skeleton loaders for list items and cards, based on `Skeleton` component from `components/ui/skeleton.tsx`. Always match the loading skeleton to the page layout of the page we're loading data for.

### Animation Standards

Use the BlurFade component from `@/components/magicui/blur-fade` for consistent page animations. Ask the developer if blur fade is appropriate for your use case before implementing it.

**Component Location**: `components/magicui/blur-fade.tsx`

**Preferred Settings**:

- **Duration**: `0.5` seconds (good balance between smooth and snappy)
- **Delays**: Keep minimal for responsive feel
  - Single elements: `0.1` - `0.25` seconds
  - List items: Use index-based delays (`index * 0.1`) - this pattern is encouraged
  - Sequential sections: `0.12`, `0.15`, `0.2`, `0.25` seconds

**Usage Examples**:

```tsx
// Single element
<BlurFade duration={0.5} inView>
  <Card>Content</Card>
</BlurFade>

// With small delay
<BlurFade delay={0.1} duration={0.5} inView>
  <Section>Content</Section>
</BlurFade>

// List items with staggered animation (preferred for lists)
{items.map((item, index) => (
  <BlurFade key={item.id} delay={index * 0.1} duration={0.5} inView>
    <ItemCard item={item} />
  </BlurFade>
))}

// Loading states
<BlurFade duration={0.5} inView>
  <LoadingSkeleton />
</BlurFade>
```

**Guidelines**:

- Always use `inView` prop for performance
- Keep durations consistent across the app (prefer 0.5s)
- Use index-based delays for list animations
- Add BlurFade to loading states and skeleton components
- Avoid delays longer than 0.25s for individual elements

### Error Handling

- Use Sonner toast library for user feedback
- Implement error boundaries for component-level errors. See `components/error-boundary.tsx`.
- Use PostHog for error tracking and analytics

## Authentication Patterns

### User Roles

- **User**
- **Admin**

### Protected Routes

- Middleware handles authentication at the route level
- Client-side checks for role-based access control
- Redirect to login for unauthenticated users

### Authentication Flow

- Email/OTP or Google OAuth via Supabase Auth
- Automatic profile creation on signup

## State Management

### Zustand Stores

- **Setup Steps** - Demo Zustand store in `stores/` directory for new developers

### TanStack Query Keys

- Use consistent query key patterns: `['entity', 'action', ...params]`
- Implement proper cache invalidation
- Use infinite queries for paginated lists
- Always invalidate relevant queries after mutations

## Development Workflow

### Package Management

- Use `bun` for all package operations
- Install dependencies: `bun add <package>`
- Install dev dependencies: `bun add -D <package>`
- Add shadcn components: `bunx --bun shadcn@latest add <component>`

### Database Development

- Generate types from local database: `bun gen:types`
- Create migrations: `bun supabase:db:diff <migration_name>`
- Apply migrations: `bun supabase:migrate:up`

### Documentation Standards

All new features and significant functionality changes must be documented in the `docs/` directory:

#### Business Documentation (`docs/business/`)

- **Purpose**: Document features from a business/user perspective
- **Audience**: Product managers, stakeholders, customer support
- **Content**:
  - Feature overview and business purpose
  - User workflows and use cases
  - Business rules and validation logic
  - Integration points with other features
  - Success metrics and KPIs
  - Future enhancement opportunities
- **Format**: Comprehensive markdown files with clear structure
- **Examples**: User journeys, feature specifications, business logic explanations

#### Technical Documentation (`docs/technical/`)

- **Purpose**: Document implementation details and architecture decisions
- **Audience**: Developers, DevOps, technical stakeholders
- **Content**:
  - API documentation and schemas
  - Database design and relationships
  - Architecture patterns and decisions
  - Performance considerations
  - Security implementations
  - Deployment procedures
- **Format**: Technical specifications, code examples, diagrams
- **Examples**: API references, database schemas, system architecture

#### Documentation Requirements

- **When to Document**: Create documentation for all new features, significant refactors, or complex business logic
- **Update Policy**: Keep documentation current with code changes
- **Review Process**: Documentation should be reviewed alongside code changes
- **Naming Convention**: Use kebab-case for file names, descriptive titles

### Code Quality

- Implement proper error handling
- Do NOT run `bun dev` or `bun build` to validate your changes. I will do that.
- After completing large multi-file changes that affect TypeScript types or interfaces, run `bun type:check` to verify type correctness across the entire codebase before considering the task complete.

### Railway Deployment

The project is configured for deployment to Railway using config-as-code via `railway.toml`.

#### Quick Start

```bash
# 1. Set up Railway CLI and link project
bun run railway:setup

# 2. Push environment variables to Railway
bun run railway:push-env

# 3. Deploy (or push to main branch for automatic deployment)
railway up
```

#### Configuration

The `railway.toml` file at the project root configures:

- **Builder**: Nixpacks with Bun support
- **Build Command**: `bun run build`
- **Start Command**: `bun start`
- **Health Checks**: Enabled at `/` with 100s timeout
- **Restart Policy**: Automatic restart on failure (max 3 retries)

#### Database Migrations

**Important**: Database migrations are handled by the Supabase GitHub Preview Integration, NOT by Railway. The Railway deployment does not include pre-deploy migration commands to prevent conflicts.

#### Environment Variables

Use the provided script to manage environment variables:

```bash
# Interactive mode - prompts for each variable
bun run railway:push-env

# Or manually set via CLI
railway variables --set VARIABLE_NAME=value
```

All required environment variables are documented in `.env.example`.

#### Deployment Options

**Automatic (Recommended):**

Push to your main branch, and Railway automatically deploys via GitHub webhook.

**Manual:**

```bash
railway up              # Deploy current directory
railway logs --follow   # View deployment logs
railway open            # Open deployment in browser
```

#### Monitoring and Logs

```bash
railway logs            # View recent logs
railway logs --follow   # Real-time log streaming
railway status          # Check deployment status
railway variables       # List environment variables
```

For detailed deployment instructions, troubleshooting, and best practices, see `docs/technical/railway-deployment.md`.

## Scheduled Tasks & Automation

### Cron Jobs

- **Infrastructure**: Cron Jobs for scheduled task execution
- **Security**: Protected endpoints using `CRON_SECRET` environment variable
- **Location**: API routes in `/app/api/cron/[job-name]/route.ts`

### Testing Cron Jobs Locally

```bash
# Test with curl (requires CRON_SECRET env var)
curl -H "Authorization: Bearer your-secret-here" \
  http://localhost:3000/api/cron/demo
```

## Database Seeding

### Seed Script Workflow

1. **Initial Seeding**:

   ```bash
   bun seed      # Run the seed script first
   bun db:reset  # Then reset the database
   ```

2. **After Database Schema Changes**:

   ```bash
   bun seed:sync          # Sync Snaplet with the new database schema
   bun seed               # Run the seed script
   bun db:reset           # Reset the database
   ```

### Important Notes

- After modifying database schemas, you MUST run `seed:sync` to synchronize Snaplet with the database before seeding again
- This ensures that Snaplet generates data that matches your current schema
