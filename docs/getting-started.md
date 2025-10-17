# Getting Started with create-reodor-app

Welcome! This guide will walk you through setting up create-reodor-app on your local machine. We'll take it step by step, and explain not just the "what" but also the "why" along the way.

## Prerequisites

Before we begin, make sure you have these tools installed:

- **Bun** - A fast JavaScript runtime and package manager ([install here](https://bun.sh/))
- **Docker Desktop** - For running Supabase locally ([install here](https://www.docker.com/products/docker-desktop/))
- **Git** - For cloning the repository

<details>
<summary>Why Bun instead of npm or yarn?</summary>

Bun is a modern JavaScript runtime that's significantly faster than Node.js for many operations. It handles package installation, script running, and even includes a built-in test runner. For this project, you'll notice commands complete much quicker compared to npm or yarn. Plus, it's fully compatible with Node.js packages, so you're not missing out on anything!

</details>

<details>
<summary>Why do we need Docker?</summary>

Supabase (our backend platform) runs as a collection of services: PostgreSQL database, authentication server, storage service, and more. Docker lets us run all of these services locally on your machine in isolated containers. This means you get a complete replica of the production environment right on your laptop - no internet connection needed for development!

</details>

## Step 1: Clone the Repository

First, let's get the code on your machine:

```bash
git clone https://github.com/your-org/create-reodor-app.git
cd create-reodor-app
```

## Step 2: Install Dependencies

Now install all the JavaScript packages the project needs:

```bash
bun install
```

This will read `package.json` and download all the libraries and tools we use - React, Next.js, Supabase SDK, and many others.

<details>
<summary>What's actually being installed?</summary>

When you run `bun install`, you're downloading hundreds of packages! Here are some of the key ones:

- **Next.js & React** - The core framework for building our web app
- **Supabase SDK** - Client libraries for talking to our database and auth system
- **TanStack Query** - Manages server data and caching in our React components
- **Zustand** - Simple state management for client-side data
- **Tailwind CSS** - Utility-first CSS framework for styling
- **shadcn/ui** - Pre-built accessible UI components
- **Zod** - TypeScript-first schema validation

All these packages work together to give you a modern, type-safe development experience.

</details>

## Step 3: Explore the Codebase

Before diving into configuration, let's get familiar with how this project is organized. Take some time to browse through these directories - understanding the architecture now will save you hours later!

### The `app/` Directory

The `app/` directory contains your entire web application. With Next.js App Router, the folder structure directly maps to URL routes. Let's walk through what's inside:

```
app/
├── admin/              # Admin-only routes (protected)
├── api/                  # API route handlers (serverless functions)
├── auth/                 # Authentication pages (sign-up, sign-in, etc.)
├── oppgaver/             # Todos feature (demo CRUD implementation)
├── profiler/             # Profile pages (dynamic routes)
├── about/                # Static: About page
├── contact/              # Static: Contact page
├── faq/                  # Static: FAQ page
├── privacy/              # Static: Privacy policy
├── terms/                # Static: Terms of service
├── error.tsx             # Error boundary fallback
├── not-found.tsx         # 404 page
├── page.tsx              # Landing page (home)
├── layout.tsx            # Root layout (wraps all pages)
├── robots.ts             # Generates robots.txt for SEO
└── sitemap.ts            # Generates sitemap.xml for SEO
```

<details>
<summary>Why is the folder structure organized this way?</summary>

**Route-based organization** - In Next.js App Router, folders create URL segments. For example:

- `app/about/page.tsx` → `yoursite.com/about`
- `app/auth/sign-in/page.tsx` → `yoursite.com/auth/sign-in`
- `app/oppgaver/[oppgaveId]/page.tsx` → `yoursite.com/oppgaver/123` (dynamic route)

This makes it incredibly easy to understand your site structure just by looking at the file tree!

**Layouts and composition** - Each folder can have a `layout.tsx` that wraps all child routes. This is perfect for:

- Adding navigation to a section
- Protecting routes with authentication
- Sharing data between related pages
- Consistent styling for a feature area

**Special files** - Next.js recognizes certain filenames:

- `page.tsx` - The actual page component for a route
- `layout.tsx` - Wraps child pages with shared UI
- `loading.tsx` - Shown while the page is loading
- `error.tsx` - Error boundary for this route subtree
- `not-found.tsx` - Custom 404 page

This organization keeps related code together and makes it easy to find what you're looking for.

</details>

#### Admin Routes (`app/(admin)/`)

The `(admin)` folder uses route groups (parentheses) to organize admin-only pages without affecting the URL structure.

<details>
<summary>What are route groups and why use them?</summary>

**Route groups** - Folders wrapped in parentheses like `(admin)` or `(marketing)` don't create URL segments. They're purely for organization and applying shared layouts.

Example:

- `app/(admin)/dashboard/page.tsx` → URL: `/dashboard` (not `/admin/dashboard`)
- `app/(admin)/users/page.tsx` → URL: `/users` (not `/admin/users`)

**Why this is useful:**

- **Shared layouts** - You can add an admin-specific layout with authentication checks
- **Code organization** - Keep admin features separate without affecting URLs
- **Team structure** - Different teams can work in different route groups
- **Multiple layouts** - Different route groups can have completely different layouts

In this project, all admin pages require authentication and admin role, enforced in the `(admin)/layout.tsx` file.

</details>

#### API Routes (`app/api/`)

API routes are serverless functions that handle backend logic. They export HTTP method handlers (GET, POST, PUT, DELETE, etc.).

**Common use cases:**

- **Webhooks** - Receive events from Stripe, GitHub, etc.
- **Cron jobs** - Scheduled tasks (protected by secrets)
- **External integrations** - Call third-party APIs with server-side credentials
- **File processing** - Handle uploads, generate PDFs, etc.

<details>
<summary>Why use API routes instead of server actions?</summary>

Both API routes and server actions run on the server, but they have different use cases:

**API Routes** - Use when you need:

- External services to call your backend (webhooks)
- Non-React clients to access your API (mobile apps)
- Standard REST endpoints
- Fine control over HTTP headers, status codes, etc.
- Endpoints that aren't tied to React components

**Server Actions** - Use when you need:

- Form submissions from React components
- Data mutations from client components
- Progressive enhancement (works without JavaScript)
- Simplified error handling with React
- Type-safe RPC-style calls from your UI

In this project:

- Stripe webhooks use API routes (`app/api/webhooks/stripe/route.ts`)
- Todo CRUD operations use server actions (`server/todos.actions.ts`)
- Both approaches are valid; use the right tool for the job!

</details>

#### Authentication Pages (`app/auth/`)

The auth directory contains all authentication-related pages:

- **sign-in** - Email/OTP and Google OAuth login
- **sign-up** - New user registration
- **confirm** - Email verification handler
- **sign-out** - Session cleanup
- **account-deleted** - Confirmation after account deletion

<details>
<summary>How does authentication work in this app?</summary>

**Authentication flow:**

1. **User submits credentials** - Email/OTP or OAuth provider
2. **Supabase Auth handles verification** - Creates user record, sends magic link
3. **Session cookie created** - HTTP-only cookie stored in browser
4. **Automatic profile creation** - Database trigger creates profile record
5. **Redirects to dashboard** - User is now authenticated

**Key components:**

- **Client-side** - `lib/supabase/client.ts` for browser operations
- **Server-side** - `lib/supabase/server.ts` for secure operations
- **Middleware** - `middleware.ts` refreshes sessions on each request
- **Server actions** - Handle sign-in/sign-up logic
- **RLS policies** - Database enforces access control based on session

**Why this architecture?**

- **Secure by default** - Sessions are HTTP-only cookies, not localStorage
- **Automatic refresh** - Middleware keeps sessions alive
- **Type-safe** - Full TypeScript support for auth state
- **Row Level Security** - Database enforces permissions, not application code
- **Scalable** - Supabase Auth handles millions of users

</details>

#### Demo Features: Todos and Profiles

**Todos (`app/oppgaver/`)** - A complete CRUD implementation demonstrating:

- TanStack Query for data fetching and caching
- Server actions for mutations
- React Hook Form + Zod validation
- Optimistic updates
- Row Level Security (users only see their own todos)

**Profiles (`app/profiler/[profileId]/`)** - Shows dynamic routing with:

- Dynamic route parameters (`[profileId]`)
- Profile viewing and editing
- Public vs private data handling
- Image upload and storage

<details>
<summary>Why include demo features in a starter template?</summary>

**Learning by example** - These demos show you the "right way" to implement common patterns:

- **Complete patterns** - Not just snippets, but full working features
- **Best practices** - Shows type safety, error handling, loading states
- **Real-world complexity** - Handles edge cases you'll encounter in production
- **Copy-paste friendly** - Use these as templates for your own features

**What to do with them:**

1. **Study them first** - Understand the patterns before building your own features
2. **Reference them** - Keep them around while building similar features
3. **Delete them eventually** - Once you're comfortable, remove them and build your actual app

Think of them as training wheels - helpful at first, removed when you're ready!

</details>

#### Static Pages

Every production app needs these pages for legal compliance and user trust:

- **FAQ** (`app/faq/`) - Frequently asked questions
- **Privacy Policy** (`app/privacy/`) - How you handle user data (GDPR compliance)
- **Terms of Service** (`app/terms/`) - Legal agreement with users
- **About** (`app/about/`) - Company/project information
- **Contact** (`app/contact/`) - How users can reach you

<details>
<summary>Why are these pages important?</summary>

**Legal requirements:**

- **Privacy Policy** - Required by GDPR, CCPA, and most app stores
- **Terms of Service** - Protects you legally and sets expectations
- **Cookie Policy** - Required if you use analytics or ads

**User trust:**

- **Transparency** - Shows you're a legitimate business
- **Professionalism** - First impression matters
- **SEO benefits** - Search engines look for these pages

**App store requirements:**

- Both Apple App Store and Google Play require privacy policies
- They must be publicly accessible via URL
- Must explain data collection and usage

**Pro tip:** Don't copy-paste generic templates. Consult with a lawyer to ensure your policies accurately reflect your practices and comply with applicable laws!

</details>

#### SEO Configuration

Two special files help search engines understand and crawl your site:

**`robots.ts`** - Dynamically generates `robots.txt` to tell crawlers:

- Which pages to crawl and index
- Which pages to ignore (admin, API routes, private pages)
- Where to find your sitemap

**`sitemap.ts`** - Dynamically generates `sitemap.xml` listing:

- All public pages on your site
- When they were last modified
- How often they change
- Their priority relative to other pages

<details>
<summary>Why use dynamic files instead of static robots.txt?</summary>

**Dynamic generation benefits:**

1. **Stays in sync** - If you add new routes, the sitemap updates automatically
2. **Environment-specific** - Different rules for dev vs production
3. **Database-driven** - Include dynamic content (blog posts, products, etc.)
4. **TypeScript** - Type safety and autocompletion
5. **Conditional logic** - Exclude pages based on runtime conditions

**Example:** Your sitemap can query the database to include all public profiles:

```typescript
// sitemap.ts
export default async function sitemap() {
  const profiles = await getPublicProfiles();

  return [
    { url: "https://yoursite.com", lastModified: new Date() },
    ...profiles.map((profile) => ({
      url: `https://yoursite.com/profiler/${profile.id}`,
      lastModified: profile.updated_at,
    })),
  ];
}
```

This ensures search engines can discover all your content without manual updates!

</details>

### The `components/` Directory

The components directory is where all your React components live, organized in a way that makes them easy to find and reuse.

```
components/
├── admin/                # Admin-specific components
│   ├── admin-dashboard.tsx
│   └── admin-layout.tsx
├── auth/                 # Authentication components
│   ├── auth-card.tsx
│   ├── auth-form.tsx
│   ├── google-sign-in-button.tsx
│   └── use-auth-form.ts
├── nav/                  # Navigation components
│   └── user-dropdown.tsx
├── todos/                # Todo feature components
│   ├── todo-card.tsx
│   ├── todo-dialog.tsx
│   ├── todo-form.tsx
│   ├── todos-list.tsx
│   └── todos-page-content.tsx
├── ui/                   # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── form.tsx
│   └── ... (50+ more)
├── kibo-ui/              # Kibo UI specialized components
│   └── ...
├── navbar.tsx            # Shared: Main navigation bar
├── footer.tsx            # Shared: Site footer
├── error-boundary.tsx    # Shared: Error handling
├── profile-form.tsx      # Shared: User profile form
└── ... (more shared components)
```

<details>
<summary>Why organize components this way?</summary>

**Feature-based organization** - Components are grouped by the feature they belong to:

- **`admin/`** - Only admin users see these
- **`auth/`** - Authentication flows (sign-in, sign-up)
- **`todos/`** - Everything related to the todos feature
- **`nav/`** - Navigation-specific components

This keeps related code together and makes it clear which components are part of which feature.

**UI library separation** - Component libraries have their own directories:

- **`ui/`** - shadcn/ui components (your primary component library)
- **`kibo-ui/`** - Specialized Kibo UI components for advanced use cases

**Shared at root** - Components used across multiple features live at the root:

- `navbar.tsx` - Used on every page
- `footer.tsx` - Used on every page
- `error-boundary.tsx` - Error handling wrapper
- `profile-form.tsx` - User profile editing (used in multiple contexts)

**Benefits of this structure:**

1. **Easy to find** - Need a todo component? Check `components/todos/`
2. **Clear ownership** - Each feature owns its components
3. **Prevents sprawl** - Components don't get lost in a flat structure
4. **Encourages reuse** - Shared components are visible at the root
5. **Scales well** - Add new features without reorganizing existing ones

</details>

#### Feature Components

**Auth Components (`components/auth/`)** - Complete authentication UI:

- `auth-card.tsx` - Card wrapper for auth forms
- `auth-form.tsx` - Email/OTP and OAuth sign-in/sign-up forms
- `google-sign-in-button.tsx` - Google OAuth button
- `use-auth-form.ts` - Custom hook for form logic and validation

**Todo Components (`components/todos/`)** - Complete CRUD interface:

- `todo-card.tsx` - Individual todo display with actions
- `todo-dialog.tsx` - Modal for creating/editing todos
- `todo-form.tsx` - Form with React Hook Form + Zod validation
- `todos-list.tsx` - List container with filtering/sorting
- `todos-page-content.tsx` - Main page layout and state management

**Admin Components (`components/admin/`)** - Admin dashboard:

- `admin-dashboard.tsx` - Overview statistics and quick actions
- `admin-layout.tsx` - Layout wrapper with admin navigation

**Navigation Components (`components/nav/`)** - Navigation UI:

- `user-dropdown.tsx` - User menu with profile, settings, sign-out

<details>
<summary>How do feature components work together?</summary>

Let's trace the todos feature as an example:

1. **Page** (`app/oppgaver/page.tsx`) - Fetches data using TanStack Query
2. **Page Content** (`todos-page-content.tsx`) - Manages client-side state, filtering
3. **List** (`todos-list.tsx`) - Maps over todos, handles empty states
4. **Card** (`todo-card.tsx`) - Displays individual todo, has edit/delete buttons
5. **Dialog** (`todo-dialog.tsx`) - Opens modal with responsive drawer on mobile
6. **Form** (`todo-form.tsx`) - React Hook Form with Zod validation, submits via server actions

Each component has a single responsibility and can be tested independently. They communicate through props (data down) and callbacks (events up).

</details>

#### UI Components

**shadcn/ui (`components/ui/`)** - Your primary component library with 50+ components:

- **Forms**: Button, Input, Textarea, Select, Checkbox, Radio, Switch
- **Data Display**: Card, Table, Badge, Avatar, Skeleton
- **Overlays**: Dialog, Sheet, Drawer, Popover, Tooltip, Alert Dialog
- **Navigation**: Tabs, Navigation Menu, Dropdown Menu
- **Feedback**: Alert, Toast (Sonner), Progress, Spinner
- **Layout**: Separator, Scroll Area, Accordion, Collapsible
- **Special**: Calendar, Chart, Carousel, Command

**Kibo UI (`components/kibo-ui/`)** - Specialized components for advanced use cases:

- Complex form components
- Advanced date pickers
- Rich text editors
- Custom data visualizations

<details>
<summary>shadcn/ui vs traditional component libraries</summary>

**What makes shadcn/ui different:**

Traditional libraries (Material UI, Chakra UI, Ant Design):

- Install as npm packages
- Components are black boxes
- Hard to customize deeply
- Bundle size includes everything
- Tied to their design system

shadcn/ui approach:

- **Copy components into your codebase** - They're yours to modify
- **Full control** - Change anything, no wrestling with overrides
- **Tree-shakeable** - Only include what you use
- **Your design system** - Built on your Tailwind config
- **TypeScript-first** - Full type safety and autocomplete
- **Accessible** - Built on Radix UI primitives (WCAG compliant)

**How to add new components:**

```bash
# Add a single component
bunx --bun shadcn@latest add button

# Add multiple components
bunx --bun shadcn@latest add button card dialog
```

This copies the component source into `components/ui/` where you can modify it!

</details>

#### Shared Components

Components at the root level are used across multiple features:

- **`navbar.tsx`** - Main site navigation with responsive mobile menu
- **`footer.tsx`** - Site footer with links and social media
- **`error-boundary.tsx`** - React error boundary for graceful error handling
- **`profile-form.tsx`** - User profile editing with avatar upload
- **`contact-form.tsx`** - Contact form with email delivery
- **`Prism.tsx`** - Animated prism background effect (landing page)

<details>
<summary>When to create a shared component vs feature component?</summary>

**Create a feature component** when:

- It's specific to one feature (e.g., `todo-card.tsx`)
- It contains feature-specific business logic
- It's only used within one feature area
- It imports feature-specific types or actions

**Create a shared component** when:

- It's used by 2+ features (e.g., `navbar.tsx`)
- It's generic and reusable (e.g., `error-boundary.tsx`)
- It's a layout component (e.g., `footer.tsx`)
- It's a specialized UI component (e.g., `Prism.tsx`)

**Start feature-specific, promote to shared when needed:**

1. Build component in feature directory (e.g., `components/todos/card.tsx`)
2. If another feature needs it, make it generic
3. Move to root level (e.g., `components/card.tsx`)
4. Update imports in both features

Don't prematurely optimize for reuse - let usage patterns emerge naturally!

</details>

### The `docs/` Directory - Documentation for Long-Term Success

The `docs/` directory contains comprehensive documentation for your project, organized into two main categories:

```
docs/
├── business/         # Business and feature documentation
│   └── ...           # User workflows, business logic, requirements
└── technical/        # Technical implementation documentation
    └── ...           # API docs, architecture decisions, database design
```

<details>
<summary>Why document your project this way?</summary>

**Documentation is an investment in your future self and your team.** Here's why this structure matters:

**For Agentic Coding** - When working with AI coding assistants over extended periods:

- **Drag in context files** - Pull in a doc file to give complete context about what you're working on
- **Consistent understanding** - Agents can reference the same source of truth across sessions
- **Reduced repetition** - No need to re-explain complex business logic or architecture decisions
- **Better suggestions** - Well-documented context leads to more accurate code generation

**Example workflow:**

```
You: "I need to modify the booking cancellation logic"
Agent: *reads business/booking-cancellation.md*
Agent: "I see the cancellation rules include a 24-hour policy with prorated refunds..."
```

**For Team Collaboration:**

- **Onboarding** - New developers understand "why" decisions were made
- **Context preservation** - Decisions don't get lost when team members leave
- **Knowledge sharing** - Product managers can understand technical constraints
- **Change management** - Understand the impact before modifying existing features

**What to Document:**

According to `CLAUDE.md`, create documentation for:

- **Business Documentation** (`docs/business/`)

  - Feature overview and business purpose
  - User workflows and use cases
  - Business rules and validation logic
  - Integration points with other features
  - Success metrics and KPIs

- **Technical Documentation** (`docs/technical/`)
  - API documentation and schemas
  - Database design and relationships
  - Architecture patterns and decisions
  - Performance considerations
  - Security implementations

**Documentation Philosophy:**

1. **Document new features** - As you build, not after
2. **Update existing docs** - Keep them current with code changes
3. **Be specific** - "Users can cancel within 24 hours" > "Users can cancel"
4. **Include examples** - Show API requests/responses, user flows, code snippets
5. **Explain "why"** - Not just "what" the code does, but why it was built that way

**Pro tip for AI coding:** Well-documented projects allow AI assistants to maintain context across multiple sessions, making multi-week projects significantly more efficient!

</details>

### The `hooks/` Directory - Custom React Hooks

The `hooks/` directory contains custom React hooks that encapsulate reusable logic for authentication, data fetching, and file uploads.

```
hooks/
├── admin/                          # Admin-specific hooks
├── use-auth.ts                     # Authentication state and profile
├── use-current-user-image.ts       # Current user avatar
├── use-current-user-name.ts        # Current user display name
├── use-upload-avatar.ts            # Avatar upload with compression
├── use-upload-todo-attachments.ts  # Todo file uploads
├── use-debounce.ts                 # Debounce hook for search/filters
├── use-media-query.ts              # Responsive breakpoint detection
└── index.ts                        # Hook exports
```

<details>
<summary>Why custom hooks?</summary>

**Custom hooks let you:**

- **Extract complex logic** - Keep components clean and focused on UI
- **Share logic** - Reuse patterns across multiple components
- **Test independently** - Hooks can be tested without rendering components
- **Compose behavior** - Combine multiple hooks to create powerful abstractions
- **Type safety** - Full TypeScript support with autocomplete

</details>

#### Authentication Hooks

**`use-auth.ts`** - The primary authentication hook that provides:

- Current user object from Supabase Auth
- User profile data from the `profiles` table
- Loading states during authentication
- Sign-out functionality
- TanStack Query integration for caching

**Example usage:**

```tsx
const { user, profile, loading, signOut } = useAuth();

if (loading) return <Spinner />;
if (!user) return <SignInPrompt />;

return (
  <div>
    <p>Welcome, {profile?.display_name || user.email}!</p>
    <button onClick={signOut}>Sign Out</button>
  </div>
);
```

**`use-current-user-image.ts`** - Fetches the current user's avatar:

- Queries the `media` table for avatar files
- Returns the public URL for display
- Cached with TanStack Query (5-minute stale time)
- Handles missing avatars gracefully

**`use-current-user-name.ts`** - Gets the current user's display name:

- Fetches from `user_metadata.full_name`
- Returns `"?"` as fallback for anonymous users
- Useful for personalization in UI

<details>
<summary>How do these hooks work together?</summary>

These hooks are designed to be composable. Here's a real-world example:

```tsx
// In components/nav/user-dropdown.tsx
export function UserDropdown() {
  const { user, signOut } = useAuth();
  const { data: avatarUrl } = useCurrentUserImage();
  const userName = useCurrentUserName();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={userName} />
          ) : (
            <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
          )}
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={signOut}>Sign Out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

Each hook manages one piece of state, making the component easy to understand and test.

</details>

#### File Upload Hooks - Client-Side Strategy

**`use-upload-avatar.ts`** and **`use-upload-todo-attachments.ts`** implement **client-side file uploads** with **client-side image compression**.

**Why client-side uploads?**

```tsx
// This project uses client-side uploads, NOT server-side
✅ Client → Compress → Upload to Supabase Storage
❌ Client → Server → Compress → Upload to Storage
```

**Benefits of client-side compression:**

1. **Reduced bandwidth** - Compressed images are 70-90% smaller
2. **Faster uploads** - Smaller files upload quicker
3. **Better UX** - Progress bars, instant previews
4. **Server efficiency** - No server resources used for compression
5. **Direct uploads** - Files go straight to Supabase Storage

**How it works:**

```tsx
export const useUploadAvatar = () => {
  const mutation = useMutation({
    mutationFn: async ({ userId, file }) => {
      // 1. Validate file type
      if (!allowedTypes.includes(file.type)) {
        throw new Error("Invalid file type");
      }

      // 2. Compress image on client (browser-image-compression)
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      });

      // 3. Upload directly to Supabase Storage (client SDK)
      await uploadFile(supabase, {
        bucket: "avatars",
        path: storagePath.path,
        file: compressedFile,
      });

      // 4. Update user profile with new avatar URL
      await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);
    },
  });

  return { ...mutation, isUploading: mutation.isPending };
};
```

**Key technologies:**

- **browser-image-compression** - Client-side image compression library
- **Supabase Storage** - Direct file uploads from browser
- **TanStack Query** - Mutation state management and cache invalidation
- **TypeScript** - Full type safety for file operations

<details>
<summary>When to use server-side vs client-side uploads?</summary>

**Use client-side uploads when:**

- Uploading images that need compression
- Users upload directly to their own storage buckets
- You want to show upload progress
- Files are user-generated content (avatars, attachments)

**Use server-side uploads when:**

- Processing requires server-only libraries (FFmpeg, ImageMagick)
- Security scanning is required before storage
- Files need server-side validation beyond basic type checking
- Uploading to third-party services with secret API keys

This project uses client-side uploads because:

1. **Image compression** happens in the browser (no server load)
2. **User experience** - instant previews and progress indicators
3. **Scalability** - upload traffic doesn't hit your server
4. **Simplicity** - fewer moving parts, easier to debug

</details>

#### Other Utility Hooks

**`use-debounce.ts`** - Debounces rapid value changes:

- Perfect for search inputs and filters
- Reduces unnecessary API calls
- Configurable delay (default: 300ms)

**`use-media-query.ts`** - Responsive breakpoint detection:

- Detects screen size in client components
- Used for responsive Dialog/Drawer pattern
- Example: `const isDesktop = useMediaQuery("(min-width: 768px)")`

### The `lib/` Directory - External Services & Configuration

The `lib/` directory is where external service configurations and utility functions live. Think of it as the bridge between your application code and external libraries/services.

```
lib/
├── supabase/              # Supabase client configuration
│   ├── client.ts          # Browser-side Supabase client
│   ├── server.ts          # Server-side Supabase client
│   └── middleware.ts      # Session refresh middleware
├── brand.ts               # Company branding configuration
├── resend.ts              # Resend email service config
├── tanstack-query.ts      # TanStack Query configuration
└── utils.ts               # Runtime-agnostic utility functions
```

<details>
<summary>Why organize external configs this way?</summary>

**Centralized configuration** - All external service setup in one place:

- **Easy to find** - Need to configure Stripe? Check `lib/stripe.ts`
- **Easy to update** - Change API versions in one location
- **Easy to test** - Mock external services by replacing these files
- **Clear boundaries** - Application code imports from `lib/`, never calls services directly

**Runtime-agnostic utilities** - The `utils.ts` file contains functions that work in both client and server contexts. This is important for code that needs to run everywhere without importing browser or Node.js-specific APIs.

</details>

#### Supabase Configuration (`lib/supabase/`)

The Supabase directory contains three critical files for database access:

**`client.ts`** - Browser-side Supabase client:

```typescript
// Used in client components and browser contexts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**When to use:**

- Client components (those with `"use client"`)
- Browser-based file uploads
- Real-time subscriptions
- Client-side data fetching

**`server.ts`** - Server-side Supabase client:

```typescript
// Used in server components, API routes, and server actions
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => cookieStore.set(name, value, options),
        remove: (name, options) => cookieStore.set(name, "", options),
      },
    }
  );
}
```

**When to use:**

- Server components (React Server Components)
- API routes (`app/api/*/route.ts`)
- Server actions (`"use server"` functions)
- Any server-side data fetching

**`middleware.ts`** - Session refresh logic:

Automatically refreshes user sessions on each request to keep users logged in. This runs before every page load and API call.

<details>
<summary>Why two different Supabase clients?</summary>

**Security and functionality requirements differ:**

**Browser client (`client.ts`)**:

- Uses cookies to maintain session
- Can't access server-only environment variables
- Subject to CORS restrictions
- Limited by browser security model

**Server client (`server.ts`)**:

- Full access to session cookies
- Can use service role key for admin operations
- No CORS restrictions
- Can perform privileged operations

**Using the wrong client causes problems:**

```typescript
// ❌ WRONG - Using browser client in server action
"use server";
import { createClient } from "@/lib/supabase/client"; // Browser client!

export async function getUsers() {
  const supabase = createClient();
  // This won't have access to the session cookie!
}

// ✅ CORRECT - Using server client in server action
("use server");
import { createClient } from "@/lib/supabase/server"; // Server client!

export async function getUsers() {
  const supabase = await createClient();
  // Now it can read the session from cookies
}
```

**Rule of thumb:**

- See `"use client"`? → Use `lib/supabase/client.ts`
- See `"use server"` or in `app/**/page.tsx`? → Use `lib/supabase/server.ts`

</details>

#### Company Branding (`lib/brand.ts`)

The `brand.ts` file is the single source of truth for your company's branding and configuration. This makes it easy to rebrand the entire app or use the template for a new project.

**Example structure:**

```typescript
export const companyConfig = {
  name: "Your Company Name",
  description: "Your company description",
  url: "https://yourcompany.com",
  githubUrl: "https://github.com/yourorg/yourrepo",
  supportEmail: "support@yourcompany.com",
  social: {
    twitter: "@yourcompany",
    linkedin: "company/yourcompany",
  },
  legal: {
    companyName: "Your Company AS",
    address: "123 Main St, City, Country",
    orgNumber: "123456789",
  },
};
```

**Why this matters:**

- **One place to update** - Change your company name once, updates everywhere
- **Type safety** - TypeScript ensures all required fields are present
- **Easy rebranding** - Clone the template, update one file, done!
- **Consistent references** - Footer, navbar, meta tags all use the same data

**Where it's used:**

- SEO meta tags (`app/layout.tsx`)
- Footer contact information
- Legal pages (Terms, Privacy)
- Email templates
- Error pages

#### External Service Configuration

**Resend (`lib/resend.ts`)** - Email service configuration:

```typescript
import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);
```

Used for sending transactional emails (welcome emails, password resets, notifications).

**TanStack Query (`lib/tanstack-query.ts`)** - Global query configuration:

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

This sets defaults for all queries in your app (cache duration, retry logic, etc.).

<details>
<summary>When to add a new service config?</summary>

Add a new file in `lib/` when you integrate a new external service:

**Create `lib/stripe.ts` when you add Stripe:**

```typescript
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
  typescript: true,
});
```

**Create `lib/postmark.ts` if you switch email providers:**

```typescript
import { ServerClient } from "postmark";

export const postmark = new ServerClient(process.env.POSTMARK_API_KEY!);
```

**Benefits of this pattern:**

- Easy to mock in tests (`jest.mock("@/lib/stripe")`)
- API keys centralized and validated
- Easy to swap implementations
- Clear dependencies

</details>

#### Runtime-Agnostic Utilities (`lib/utils.ts`)

The `utils.ts` file contains utility functions that work in both client and server contexts. These are functions that don't depend on browser APIs (like `window` or `document`) or Node.js APIs (like `fs` or `path`).

**What belongs here:**

```typescript
// ✅ String manipulation
export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-");
}

// ✅ Date formatting (using date-fns, not browser Intl)
export function formatDate(date: Date): string {
  return format(date, "MMM d, yyyy");
}

// ✅ Tailwind class merging (cn utility)
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ✅ Data transformation
export function groupBy<T>(arr: T[], key: keyof T) {
  return arr.reduce(
    (acc, item) => {
      const group = String(item[key]);
      acc[group] = acc[group] || [];
      acc[group].push(item);
      return acc;
    },
    {} as Record<string, T[]>
  );
}
```

**What doesn't belong here:**

```typescript
// ❌ Browser-specific code (create client-only util file)
export function getWindowWidth() {
  return window.innerWidth; // `window` only exists in browser!
}

// ❌ Node.js-specific code (create server-only util file)
export function readConfigFile() {
  return fs.readFileSync("config.json"); // `fs` only exists in Node.js!
}

// ❌ Supabase queries (belongs in server actions)
export async function getUsers() {
  const supabase = createClient();
  return supabase.from("users").select();
}
```

<details>
<summary>Guidelines for adding utilities</summary>

**When to add a utility to `lib/utils.ts`:**

1. **Truly runtime-agnostic** - Works in browser AND server without modification
2. **No external dependencies** - Or dependencies that are also runtime-agnostic (lodash, date-fns)
3. **Pure functions** - No side effects, just input → output
4. **Reused across features** - If it's only used in one place, keep it local

**When NOT to use `lib/utils.ts`:**

- **Browser-only logic** → Create `lib/client-utils.ts` or keep in component
- **Server-only logic** → Create `lib/server-utils.ts` or keep in server action
- **Feature-specific** → Keep in the feature directory
- **Database operations** → Belongs in `server/` actions
- **React hooks** → Belongs in `hooks/` directory

**Example decision tree:**

```
Is the function runtime-agnostic (works everywhere)?
├─ Yes
│  ├─ Is it reused in 2+ places?
│  │  ├─ Yes → Add to lib/utils.ts
│  │  └─ No → Keep it local (colocate with usage)
│  └─ No (browser or server specific)
│     ├─ Browser → lib/client-utils.ts or component file
│     └─ Server → lib/server-utils.ts or server action
└─ No
   └─ Wrong place, reconsider
```

**Pro tip:** When unsure, start by keeping utilities close to where they're used. Only move to `lib/utils.ts` when you need them in a second place. This prevents premature abstraction and keeps the codebase easy to navigate.

</details>

### The `providers/` Directory - React Context Wrappers

The `providers/` directory contains React context providers that wrap your entire application. These are used in `app/layout.tsx` to provide global functionality across all pages.

```
providers/
└── tanstack-query-provider.tsx    # TanStack Query setup for the app
```

**How it works in `app/layout.tsx`:**

```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <TanstackQueryProvider>
          <ThemeProvider>
            {/* Your entire app lives here */}
            {children}
          </ThemeProvider>
        </TanstackQueryProvider>
      </body>
    </html>
  );
}
```

<details>
<summary>When to add a new provider</summary>

**Add a new provider when you need:**

- **Analytics/Monitoring** - PostHog, Sentry, or similar services
- **Feature Flags** - LaunchDarkly, PostHog feature flags
- **Authentication Context** - If building custom auth instead of Supabase
- **Global State** - When Zustand stores aren't enough (rare)
- **A/B Testing** - Experiment frameworks that need app-level context
- **Internationalization** - i18n providers for multi-language support

**Example - Adding a PostHog provider:**

```tsx
// providers/posthog-provider.tsx
"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    });
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
```

Then add it to `app/layout.tsx`:

```tsx
import { PHProvider } from "@/providers/posthog-provider";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PHProvider>
          <TanstackQueryProvider>{children}</TanstackQueryProvider>
        </PHProvider>
      </body>
    </html>
  );
}
```

**Important notes:**

- Most providers need `"use client"` directive (they use hooks/effects)
- Order matters - outer providers wrap inner ones
- Once set up, these are rarely modified
- Keep provider logic minimal - just setup and context wrapping

</details>

### Database Architecture - From SQL to Type-Safe Code

This project uses a powerful database workflow that automatically generates type-safe schemas from your PostgreSQL database. Understanding this flow is critical for productive development.

#### The Type Generation Pipeline

```
PostgreSQL Database
       ↓ (supabase gen types)
TypeScript Types (types/database.types.ts)
       ↓ (supazod)
Zod Schemas (schemas/database.schema.ts)
       ↓ (used in)
Server Actions & Form Validation
```

**Command to regenerate all types:**

```bash
bun gen:types  # Runs db:types → db:types:zod → remove:public:prefix
```

<details>
<summary>Why this three-step process?</summary>

**Step 1: PostgreSQL → TypeScript**

- Supabase CLI reads your database schema
- Generates TypeScript types in `types/database.types.ts`
- Includes tables, enums, functions, and their relationships
- Gives you autocomplete for database queries

**Step 2: TypeScript → Zod**

- Supazod converts TypeScript types to Zod schemas
- Output: `schemas/database.schema.ts`
- Configuration: `supazod.config.json` (rarely needs changes)
- Enables runtime validation and form schema generation

**Step 3: Cleanup**

- Removes `public.` prefix from schema names
- Makes imports cleaner: `Todos_Insert` instead of `public_Todos_Insert`

**Benefits:**

1. **Single source of truth** - Database schema drives everything
2. **Type safety** - Catch errors at compile time
3. **Runtime validation** - Zod validates data at runtime
4. **Form integration** - React Hook Form uses Zod schemas directly
5. **Always in sync** - Run `bun gen:types` after schema changes

</details>

### The `supabase/schemas/` Directory - Declarative Database Design

The `supabase/schemas/` directory contains declarative SQL files that define your database structure. These files are used to generate migrations with `bun db:diff`.

```
supabase/schemas/
├── 00-extensions.sql    # PostgreSQL extensions (uuid-ossp, etc.)
├── 01-schema.sql        # Tables, enums, indexes
├── 02-policies.sql      # Row Level Security policies
└── 03-functions.sql     # Database functions and triggers
```

**Workflow:**

1. **Modify schema files** - Edit SQL files to add tables, columns, policies
2. **Generate migration** - `bun db:diff migration_name` compares with local DB
3. **Review migration** - Check generated SQL in `supabase/migrations/`
4. **Apply migration** - `bun migrate:up` applies the new migration
5. **Regenerate types** - `bun gen:types` updates TypeScript/Zod schemas

<details>
<summary>Why organize schemas this way?</summary>

**Separation of concerns:**

- **00-extensions.sql** - PostgreSQL extensions (uuid-ossp, pgcrypto, etc.)
- **01-schema.sql** - Core data structures (tables, columns, enums, indexes)
- **02-policies.sql** - Row Level Security (who can access what)
- **03-functions.sql** - Stored procedures, triggers, and computed logic

**Benefits:**

1. **Easier to review** - Each file has a clear purpose
2. **Better diffs** - Git shows what changed where
3. **Logical grouping** - Related code stays together
4. **Migration generation** - Supabase compares these files with your local DB
5. **Documentation** - Files serve as living documentation

**Example from `01-schema.sql`:**

```sql
-- Priority enum type
create type public.priority_level as enum ('low', 'medium', 'high');

-- Todos table
create table public.todos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  completed boolean default false not null,
  priority public.priority_level,
  due_date timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Indexes for performance
create index todos_user_id_idx on public.todos(user_id);
create index todos_completed_idx on public.todos(completed);
```

**Example from `02-policies.sql`:**

```sql
-- Users can view their own todos
create policy "Users can view their own todos"
  on public.todos for select
  using (auth.uid() = user_id);

-- Users can create their own todos
create policy "Users can create their own todos"
  on public.todos for insert
  with check (auth.uid() = user_id);
```

**Example from `03-functions.sql`:**

```sql
-- Function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for todos updated_at
create trigger todos_updated_at
  before update on public.todos
  for each row
  execute function public.handle_updated_at();
```

**Important:** Always run `bun gen:types` after modifying these files to keep your TypeScript/Zod schemas in sync!

</details>

### The `seed/` Directory - Test Data That Saves Production

The `seed/` directory contains scripts to populate your database with realistic test data. This is crucial for testing edge cases before they hit production.

```
seed/
├── seed.ts              # Main seed orchestration
├── utils/
│   ├── index.ts         # Exported utility functions
│   ├── shared.ts        # Shared seed utilities
│   └── ...              # Feature-specific seed utils
└── (generated by Snaplet after sync)
```

**Key Commands:**

```bash
bun seed:sync   # Sync Snaplet with current database schema
bun seed        # Generate seed.sql from seed.ts
bun db:reset    # Reset DB and apply migrations + seed data
```

<details>
<summary>Why seed scripts are critical (especially with AI agents)</summary>

**The Problem:**

You're building a discount code feature with:

- Expiry dates
- Maximum usage limits
- Minimum order amounts
- User-specific restrictions
- Combination rules

Without seed data, you manually test each scenario. With 5 edge cases, you're manually creating 5 discount codes, 5 orders, 5 users... over and over again every time you reset your database.

**The Solution with AI Agents:**

```
You: "I'm adding a discount codes feature with expiry dates, max usage,
     and minimum order amounts. Update the seed script to test these scenarios:

     1. Valid discount - everything works
     2. Expired discount - should reject
     3. Max usage reached - should reject
     4. Order below minimum - should reject
     5. Already used by user (single-use) - should reject"

Agent: *Updates database schema in supabase/schemas/01-schema.sql*
Agent: *Updates seed/seed.ts to create these exact scenarios*
Agent: *Generates migration with bun db:diff*
```

Now run `bun db:reset` and you instantly have 5 test scenarios ready to verify your logic works correctly!

**Real-world example from the codebase:**

```typescript
// seed/seed.ts
async function main() {
  const seed = await createSeedClient({ dryRun: true });
  await seed.$resetDatabase();

  // 1. Create users with different roles
  const allUsers = await createTestUsersWithAuth(seed);
  //    - Admin user with elevated permissions
  //    - Regular users for testing RLS policies
  //    - Edge case: User with no profile data

  // 2. Create todos with various states
  const todos = await createTodoItems(seed, allUsers);
  //    - Completed todos
  //    - Overdue todos (due_date in past)
  //    - High priority todos
  //    - Todos with no priority (null value)
  //    - Todos with attachments

  // 3. Create media/attachments
  const attachments = await createTodoAttachments(seed, todos);
  //    - Valid image attachments
  //    - Edge case: Orphaned media (no todo)
  //    - Different media types (avatar, todo_attachment)
}
```

**Benefits for long-term development:**

1. **Consistency** - Every developer gets the same test data
2. **Speed** - Reset database in seconds, not minutes
3. **Documentation** - Seed script documents edge cases
4. **CI/CD** - Automated tests use seed data
5. **AI-friendly** - Agents can generate comprehensive test scenarios

**When to update seed scripts:**

- Adding new tables/columns
- New features with edge cases
- Discovered bugs that need test coverage
- Complex business rules that need validation

**Pro tip:** When working with AI agents, always ask them to update the seed script alongside schema changes. This ensures you have test data for all scenarios immediately!

</details>

### The `schemas/` Directory - Runtime Validation

The `schemas/` directory contains auto-generated Zod schemas derived from your database types. These enable runtime validation and form schema generation.

```
schemas/
└── database.schema.ts    # Auto-generated Zod schemas from database types
```

**Generation:**

```bash
bun gen:types  # Regenerates database.schema.ts from database types
```

<details>
<summary>How to use Zod schemas from the database</summary>

**In Server Actions:**

```typescript
"use server";

import { Todos_Insert } from "@/schemas/database.schema";
import { createClient } from "@/lib/supabase/server";

export async function createTodo(data: unknown) {
  // Runtime validation
  const result = Todos_Insert.safeParse(data);

  if (!result.success) {
    return { error: "Invalid data", details: result.error };
  }

  const supabase = await createClient();
  return await supabase.from("todos").insert(result.data);
}
```

**In Forms with React Hook Form:**

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Todos_Insert } from "@/schemas/database.schema";

export function TodoForm() {
  const form = useForm({
    resolver: zodResolver(Todos_Insert),
    defaultValues: {
      title: "",
      completed: false,
      priority: "medium",
    },
  });

  // Form now validates against database schema!
}
```

**Benefits:**

1. **Runtime safety** - Catches invalid data before database insertion
2. **Form validation** - React Hook Form validates against database schema
3. **Type inference** - `z.infer<typeof Todos_Insert>` gives you TypeScript types
4. **Always in sync** - Regenerate with `bun gen:types` after schema changes
5. **Error messages** - Zod provides detailed validation errors

</details>

### The `supazod.config.json` File - Type Generation Config

This file configures how Supazod generates Zod schemas from TypeScript types. **This is set up once and rarely needs modification.**

```json
{
  "namingConfig": {
    "tableOperationPattern": "{table}_{operation}",
    "enumPattern": "{name}",
    "capitalizeNames": true,
    "separator": "_"
  }
}
```

**Generated naming examples:**

- `Todos_Insert` - Schema for inserting a todo
- `Todos_Update` - Schema for updating a todo
- `Todos_Select` - Schema for selecting/querying todos
- `PriorityLevel` - Enum schema for priority_level type

**When to modify:** Only if you want different naming conventions (rare).

### Other Important Directories

Beyond `app/`, `components/`, `docs/`, `hooks/`, `lib/`, `providers/`, and the database directories, here are other key folders:

- **`server/`** - Server actions for data mutations
- **`stores/`** - Zustand stores for client state management
- **`types/`** - TypeScript type definitions
- **`schemas/`** - Zod schemas for validation (auto-generated from database)
- **`supabase/`** - Database migrations, schemas, and edge functions

### Take Your Time

Don't rush through this exploration. Open files, read comments, trace data flows. The time invested now will pay dividends when you start building your own features.

**Suggested exploration path:**

1. Start with `app/page.tsx` (landing page) - see how components are composed
2. Look at `app/auth/sign-in/page.tsx` - understand the auth flow
3. Dive into `app/oppgaver/page.tsx` - study the data fetching patterns
4. Check `server/todos.actions.ts` - see how server actions work
5. Browse `components/ui/` - familiarize yourself with available components
6. Read `supabase/schemas/` - understand your database structure

## Step 4: Set Up Environment Variables

Create your local environment file by copying the example:

```bash
cp .env.example .env
```

Don't worry about filling in all the values yet - we'll add the Supabase keys in a moment. The `.env` file is where we store sensitive configuration that shouldn't be committed to git.

<details>
<summary>Why use environment variables?</summary>

Environment variables let us configure our app differently for different environments (local development, staging, production) without changing code. They also keep secrets like API keys out of version control.

For example, your local Supabase URL will be `http://localhost:54321`, but in production it'll be something like `https://your-project.supabase.co`. By using environment variables, the same code works in both places!

</details>

## Step 5: Install Supabase CLI

The Supabase CLI is a command-line tool that lets you run the entire Supabase stack locally. Install it based on your operating system:

### macOS

```bash
brew install supabase/tap/supabase
```

### Windows

```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Linux

```bash
brew install supabase/tap/supabase
```

<details>
<summary>What does the Supabase CLI actually do?</summary>

The Supabase CLI is your control center for local development. It:

- **Manages Docker containers** - Starts/stops all the Supabase services
- **Handles database migrations** - Tracks changes to your database schema over time
- **Generates TypeScript types** - Creates type definitions from your database schema
- **Provides access to logs** - Helps you debug when things go wrong
- **Manages secrets** - Handles environment variables for your functions

Think of it as the glue between your code and the running Supabase services.

</details>

## Step 6: Initialize and Start Supabase

Now we'll set up the local Supabase environment:

```bash
# Initialize Supabase configuration (creates a supabase/ folder)
supabase init

# Start all Supabase services
supabase start
```

The first time you run `supabase start`, it will download several Docker images. This can take 5-10 minutes, so grab a coffee! ☕

When everything is running, you'll see output like this:

```
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
     Mailpit URL: http://localhost:54324
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

<details>
<summary>What are all these services?</summary>

When you start Supabase, you're actually starting multiple services:

- **PostgreSQL Database** (port 54322) - Your actual database where data is stored
- **PostgREST API** (port 54321) - Auto-generates a REST API from your database schema
- **Supabase Studio** (port 54323) - A visual interface for managing your database, like phpMyAdmin
- **GoTrue Auth** - Handles user authentication (email/password, OAuth, magic links)
- **Realtime** - Enables WebSocket connections for live data updates
- **Storage** - Manages file uploads and downloads
- **Mailpit** (port 54324) - A local email server that catches all emails sent by your app (super useful for testing!)

Each service runs in its own Docker container, isolated from your system and from each other.

</details>

<details>
<summary>What are these "keys" for?</summary>

Supabase uses JWT (JSON Web Tokens) for authentication. You'll see two keys:

- **anon key** - This is the public key used in your frontend code. It's safe to expose in client-side JavaScript. It gives limited, role-based access to your database.

- **service_role key** - This is the private key with full admin access to your database. Never use this in client-side code! Only use it in server-side code (like API routes or server actions) where it won't be exposed to users.

These keys tell Supabase what level of access to grant. Your database Row Level Security (RLS) policies then determine exactly what data each role can access.

</details>

## Step 7: Update Your Environment Variables

Now that Supabase is running, let's grab those keys and add them to your `.env` file.

First, check your Supabase status to see all the URLs and keys:

```bash
supabase status
```

Open your `.env` file and update these values:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key-from-supabase-status>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key-from-supabase-status>
```

<details>
<summary>Why do some variables start with NEXT_PUBLIC_?</summary>

In Next.js, environment variables are only available on the server by default (for security). If you want a variable to be accessible in client-side JavaScript (in the browser), you need to prefix it with `NEXT_PUBLIC_`.

- `NEXT_PUBLIC_SUPABASE_URL` - Clients need to know where to send API requests
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clients use this for authenticated requests
- `SUPABASE_SERVICE_ROLE_KEY` - NO PREFIX! This should never be sent to clients

Always be careful about what you expose with `NEXT_PUBLIC_` - never use it for secrets!

</details>

## Step 8: Set Up the Database

Now we'll initialize your database with the proper schema and seed data:

```bash
# Start the database (if not already running)
bun db:start

# Reset the database to a clean state and apply all migrations
bun db:reset

# Sync Snaplet with your database structure (for generating realistic seed data)
bun seed:sync

# Generate TypeScript types from your database schema
bun gen:types
```

<details>
<summary>What's happening with each of these commands?</summary>

Let's break down each command:

**`bun db:start`** - Starts the Supabase services (same as `supabase start`). If they're already running, this does nothing.

**`bun db:reset`** - This is a powerful command that:

1. Drops your entire local database
2. Recreates it from scratch
3. Applies all migrations in `supabase/migrations/` in order
4. Runs your seed files to populate initial data

This gives you a fresh, consistent starting point.

**`bun seed:sync`** - Snaplet is a tool that generates realistic fake data for your database. This command analyzes your current database schema (tables, columns, relationships) and creates a configuration file so Snaplet knows what kind of data to generate. You need to run this whenever you change your database structure.

**`bun gen:types`** - This reads your database schema and generates TypeScript type definitions in `types/database.types.ts`. This means you get autocomplete and type checking when writing database queries! For example, TypeScript will know exactly what columns exist in your `users` table.

</details>

<details>
<summary>What are database migrations?</summary>

Migrations are like "version control for your database." Each migration file is a SQL script that describes a change to your database schema - adding a table, creating an index, modifying a column, etc.

Migrations are stored in `supabase/migrations/` with timestamps:

```
20231201120000_create_users_table.sql
20231201130000_add_email_index.sql
20231201140000_create_todos_table.sql
```

When you run `bun db:reset`, Supabase applies these migrations in order, building up your database schema step by step. This approach has huge benefits:

- **Reproducible** - Anyone on the team can recreate the exact same database structure
- **Trackable** - You can see the full history of database changes in git
- **Reversible** - You can roll back to previous versions (though this project currently only uses forward migrations)
- **Production-ready** - The same migrations that work locally can be applied to staging and production

It's like having git commits, but for your database schema!

</details>

## Step 9: Start the Development Server

You're almost there! Start the Next.js development server:

```bash
bun dev
```

The application should now be running at **<http://localhost:3000>**. Open it in your browser and you should see the landing page!

<details>
<summary>What happens when you run bun dev?</summary>

When you start the dev server, Next.js does several things:

- **Compiles your TypeScript** - Converts `.tsx` and `.ts` files to JavaScript
- **Processes Tailwind CSS** - Scans your components for class names and generates the minimal CSS needed
- **Enables Hot Module Replacement (HMR)** - When you save a file, the browser updates instantly without a full refresh
- **Starts the Next.js server** - Handles both server-side rendering and API routes
- **Watches for changes** - Automatically recompiles when you edit files

The first compilation takes a few seconds, but subsequent updates are nearly instant thanks to HMR!

</details>

## Step 10: Test Authentication

Let's verify everything is working by creating a test user account.

### Create an Account

1. Navigate to **<http://localhost:3000>**
2. Click "Sign In" or "Get Started" (depending on your UI)
3. Click "Sign Up" to create a new account
4. Enter an email address (can be fake like `test@example.com`)
5. Click the button to send the login code

### Check the Local Email Server

Since you're developing locally, emails aren't actually sent to your email provider. Instead, they're caught by Mailpit!

1. Open **<http://localhost:54324/>** in a new browser tab
2. You should see an email with the subject "Your Magic Link" or similar
3. Click on the email to see the login code

<details>
<summary>Why use a local email server?</summary>

Mailpit is a brilliant tool for local development. Here's why:

- **No external services needed** - You don't need to configure SendGrid, AWS SES, or any other email provider just for local testing
- **Catch all emails** - Every email your app "sends" is captured here, so nothing gets lost
- **No spam issues** - You're not actually sending emails, so no risk of being flagged as spam
- **Test any email address** - Use `test@example.com`, `admin@test.com`, whatever you want - they all work
- **See exactly what users see** - View the rendered HTML email exactly as it would appear to users

In production, these emails will be sent via Resend (configured in your production environment variables). But for development, Mailpit is perfect!

</details>

### Complete the Sign In

1. Copy the login code from Mailpit
2. Return to your application tab
3. Enter the code to complete authentication
4. You should now be signed in!

### Verify in Supabase Studio

Want to see your user in the database?

1. Open **<http://localhost:54323/>** (Supabase Studio)
2. Click "Authentication" in the left sidebar
3. You should see your newly created user

<details>
<summary>What just happened with authentication?</summary>

When you signed up, here's what happened behind the scenes:

1. **Client sends signup request** - Your browser sent the email to Supabase Auth
2. **Supabase creates user record** - A new entry was created in the `auth.users` table
3. **Magic link generated** - Supabase created a unique, time-limited token
4. **Email sent** - Supabase tried to send an email (caught by Mailpit locally)
5. **User clicks link** - When you entered the code, Supabase verified the token
6. **Session created** - Supabase issued a JWT token to your browser
7. **Profile created** - A database trigger automatically created a record in `public.profiles`

Now your browser has a session cookie that proves you're authenticated. This cookie is automatically included with every request to Supabase, allowing Row Level Security policies to work correctly.

The beauty of this system is that you never handle passwords directly - Supabase manages all the security for you!

</details>

## Step 11: Link Local Development to Remote Supabase (Optional)

While you can develop entirely locally, linking your local environment to a remote Supabase project enables database schema synchronization and prepares you for production deployment.

### Create a Remote Supabase Project

1. Go to **<https://supabase.com>** and sign up/sign in
2. Click "New Project"
3. Fill in your project details:
   - **Name**: Choose a descriptive name
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Select the closest to your users
4. Click "Create new project" (this takes ~2 minutes)

### Link Your Local Project

Once your remote project is created:

```bash
# Login to Supabase CLI
supabase login

# Link your local project to the remote project
# Find your project ref in the Supabase dashboard URL: https://supabase.com/dashboard/project/[project-ref]
supabase link --project-ref <your-project-ref>
```

The CLI will ask you for your database password (the one you created when setting up the project).

<details>
<summary>What does linking do?</summary>

Linking creates a connection between your local development environment and your remote Supabase project. This enables:

- **Pulling remote schema** - Download the production database schema to your local machine
- **Pushing migrations** - Deploy local database changes to production
- **Type generation** - Generate types from either local or remote database
- **Configuration sync** - Share configuration between environments

**Important security note:** Your database password is stored locally in your Supabase config. This is safe for development, but never commit the `.env` file or Supabase config with credentials to version control!

</details>

### Understanding the Database Development Workflow

Now that you understand the basics, let's dive into how you'll actually work with the database day-to-day. This workflow is **critical** to understand - it's how you'll extend your schema safely and deploy changes to production.

## The Database Development Lifecycle

### The Complete Flow

```
1. Modify Schema Files (supabase/schemas/*.sql)
   ↓
2. Generate Migration (bun db:diff <migration-name>)
   ↓
3. Review Generated SQL (supabase/migrations/<timestamp>_<name>.sql)
   ↓
4. Apply Migration Locally (bun db:reset or supabase migration up)
   ↓
5. Generate Types (bun gen:types)
   ↓
6. Test Your Changes (bun dev)
   ↓
7. Commit to Git (migration files + schema files)
   ↓
8. Push to GitHub (automatic deployment via GitHub integration)
   ↓
9. Production Database Updated (migrations run automatically)
```

Let's break down each step in detail.

### Step 1: Modify Schema Files

All database changes start in `supabase/schemas/`. This is your **single source of truth** for database structure.

**Example - Adding a new `bookings` table:**

Edit `supabase/schemas/01-schema.sql`:

```sql
-- Booking status enum
create type public.booking_status as enum (
  'pending',
  'confirmed',
  'cancelled',
  'completed'
);

-- Bookings table
create table public.bookings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  service_name text not null,
  booking_date timestamptz not null,
  status public.booking_status default 'pending' not null,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Indexes for performance
create index bookings_user_id_idx on public.bookings(user_id);
create index bookings_booking_date_idx on public.bookings(booking_date);
create index bookings_status_idx on public.bookings(status);
```

Then add RLS policies in `supabase/schemas/02-policies.sql`:

```sql
-- Enable RLS
alter table public.bookings enable row level security;

-- Users can view their own bookings
create policy "Users can view their own bookings"
  on public.bookings for select
  using (auth.uid() = user_id);

-- Users can create their own bookings
create policy "Users can create their own bookings"
  on public.bookings for insert
  with check (auth.uid() = user_id);

-- Users can update their own bookings
create policy "Users can update their own bookings"
  on public.bookings for update
  using (auth.uid() = user_id);

-- Admins can view all bookings
create policy "Admins can view all bookings"
  on public.bookings for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
```

<details>
<summary>Why edit schema files instead of writing migrations directly?</summary>

**Declarative vs Imperative approach:**

**Traditional approach (Imperative):**

- Write SQL migrations by hand: "ALTER TABLE users ADD COLUMN email TEXT"
- Error-prone: Easy to forget constraints, indexes, or ordering
- Hard to review: Migrations are long lists of ALTER statements
- Difficult to understand: Current schema spread across 100+ migration files

**This project's approach (Declarative):**

- Define the **desired state** in schema files: "Users table should have these columns"
- Supabase CLI generates migrations by comparing desired state vs current database
- Easy to review: See the complete table definition in one place
- Self-documenting: Schema files show current structure at a glance

**Example benefit:**

If you need to understand the `bookings` table structure, you:

- **Declarative**: Open `01-schema.sql`, find the CREATE TABLE statement ✅
- **Imperative**: Read through 50 migration files to piece together the current structure ❌

</details>

### Step 2: Generate Migration

After modifying schema files, generate a migration that captures the difference between your schema files and your current local database:

```bash
bun db:diff add_bookings_table
```

This command:

1. Reads your schema files (`supabase/schemas/*.sql`)
2. Compares them to your running local database
3. Generates SQL migration file with the differences
4. Saves it to `supabase/migrations/<timestamp>_add_bookings_table.sql`

**Output:**

```
Diffing schemas: public
Finished supabase db diff on branch main.
```

<details>
<summary>What if the migration looks wrong?</summary>

**Always review the generated migration!** Sometimes the diff tool can't perfectly detect your intent.

**Common issues:**

1. **Dropping and recreating instead of altering**

   - Problem: Migration drops a column and recreates it (data loss!)
   - Fix: Manually edit migration to use ALTER TABLE instead

2. **Incorrect order of operations**

   - Problem: Migration tries to add foreign key before creating the referenced table
   - Fix: Reorder statements in the migration file

3. **Missing data migrations**
   - Problem: Adding a NOT NULL column without default value
   - Fix: Add a data migration to populate existing rows first

**If the migration is incorrect:**

```bash
# Delete the bad migration file
rm supabase/migrations/<timestamp>_bad_migration.sql

# Fix your schema files
# Regenerate the migration
bun db:diff add_bookings_table_fixed
```

**Pro tip:** Keep your local database clean by regularly running `bun db:reset` before generating migrations. This ensures the diff is against a known good state.

</details>

### Step 3: Review Generated SQL

**CRITICAL: Always manually review the generated migration before applying it!**

Open `supabase/migrations/<timestamp>_add_bookings_table.sql` and verify:

- ✅ Tables are created in the correct order (dependencies first)
- ✅ Indexes are added for foreign keys and frequently queried columns
- ✅ RLS policies are present and correct
- ✅ No `DROP` statements that would lose data
- ✅ Enums are created before tables that use them
- ✅ Functions/triggers are created correctly

<details>
<summary>Example migration review checklist</summary>

```sql
-- ✅ GOOD: Safe operations
CREATE TABLE public.bookings (...);
CREATE INDEX bookings_user_id_idx ON public.bookings(user_id);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own bookings" ON public.bookings...;

-- ⚠️ WARNING: Review carefully
ALTER TABLE public.users ALTER COLUMN email SET NOT NULL;
-- Could fail if existing rows have NULL emails

-- ❌ DANGEROUS: Data loss
DROP TABLE public.old_bookings;
-- All data in this table will be lost!

-- ❌ DANGEROUS: Recreating instead of altering
DROP TABLE public.users;
CREATE TABLE public.users (...);
-- All user data would be lost!
```

**If you see dangerous operations:**

1. Stop and review your schema changes
2. Consider if this is really what you want
3. If needed, manually edit the migration to be safer
4. Add data migration steps to preserve existing data

</details>

### Step 4: Apply Migration Locally

Once you've reviewed and approved the migration, apply it to your local database:

```bash
# Option 1: Apply just the new migration
supabase migration up

# Option 2: Reset database (applies ALL migrations from scratch)
bun db:reset
```

**When to use each:**

- `supabase migration up` - Quick iteration, just applies new migrations
- `bun db:reset` - Clean slate, ensures consistent state, applies seed data

<details>
<summary>What if the migration fails?</summary>

**Common failure scenarios:**

**1. Constraint violation:**

```
ERROR: column "email" contains null values
```

**Solution:** Add a default value or data migration to populate existing rows

**2. Dependency order issue:**

```
ERROR: relation "profiles" does not exist
```

**Solution:** Reorder your migration to create dependencies first

**3. RLS policy conflict:**

```
ERROR: policy "Users can view their own bookings" already exists
```

**Solution:** The policy might be duplicated. Check your schema files.

**Recovery steps:**

```bash
# Reset to clean state
bun db:reset

# If reset fails, nuclear option:
supabase db reset --db-url postgresql://postgres:postgres@localhost:54322/postgres

# Fix the migration file
# Try applying again
supabase migration up
```

</details>

### Step 5: Generate TypeScript Types

After applying migrations, regenerate your TypeScript types and Zod schemas:

```bash
bun gen:types
```

This command runs three operations:

1. **Generates TypeScript types** from database schema → `types/database.types.ts`
2. **Generates Zod schemas** from TypeScript types → `schemas/database.schema.ts`
3. **Cleans up** the generated files (removes `public.` prefix)

<details>
<summary>Why regenerate types after every schema change?</summary>

**Type safety across the entire stack:**

Without regenerating types, you get:

```typescript
// ❌ TypeScript doesn't know about the new column
const booking = await supabase.from("bookings").insert({
  user_id: userId,
  service_name: "Hair Cut",
  bookign_date: new Date(), // Typo! But TypeScript won't catch it
});
```

After regenerating types:

```typescript
// ✅ Full autocomplete and type checking
const booking = await supabase.from("bookings").insert({
  user_id: userId,
  service_name: "Hair Cut",
  booking_date: new Date(), // Typo caught at compile time!
  status: "pending",
  // TypeScript knows all required fields
});
```

**Benefits:**

- Autocomplete for table names, column names, enum values
- Type errors if you use wrong data types
- Compile-time errors instead of runtime errors
- Zod schemas for form validation match database exactly

</details>

### Step 6: Test Your Changes

Start your development server and test the new features:

```bash
bun dev
```

Create components that use the new tables:

- Server actions in `server/bookings.actions.ts`
- React components that query/mutate data
- Forms with validation using the generated Zod schemas

**Example server action:**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { Bookings_Insert } from "@/schemas/database.schema";

export async function createBooking(data: unknown) {
  // Runtime validation using generated Zod schema
  const result = Bookings_Insert.safeParse(data);
  if (!result.success) {
    return { error: "Invalid data", details: result.error };
  }

  const supabase = await createClient();
  return await supabase.from("bookings").insert(result.data);
}
```

### Step 7-9: Deploy to Production

Once your changes are tested locally, deploy them to production:

```bash
# Commit your changes (migration files + schema files)
git add supabase/migrations/ supabase/schemas/ types/ schemas/
git commit -m "Add bookings table with RLS policies"

# Push to GitHub
git push origin main
```

**If you have GitHub integration configured (see below), migrations are automatically applied to production when you push to your main branch.**

## Automated Database Deployments via GitHub Integration

### Why Automate Database Deployments?

**Manual deployments are dangerous:**

❌ **Manual process** (risky):

```bash
# Developer runs this in production (DANGEROUS!)
supabase db push --linked

# Problems:
# - Easy to forget steps
# - No audit trail of who deployed what
# - No rollback mechanism
# - Can deploy untested migrations
# - Deployments happen at random times
# - No review process
```

✅ **Automated process** (safe):

```
1. Developer pushes to GitHub
2. GitHub integration detects changes
3. Migrations run automatically on merge to main
4. Full audit trail in GitHub
5. Can revert by reverting the commit
6. Migrations tested in Preview Branches first
```

**Benefits of automation:**

1. **Safety** - Migrations reviewed in PRs before deployment
2. **Consistency** - Same process every time, no human error
3. **Audit trail** - Git history shows what changed when
4. **Preview environments** - Test migrations in Preview Branches
5. **Rollback capability** - Revert the commit to undo changes
6. **No manual steps** - Developers never run commands in production

<details>
<summary>Real-world scenario: Why automation matters</summary>

**Scenario: Adding a critical index to speed up queries**

**Manual deployment:**

```
11:30 AM - Developer: "Hey, can someone deploy this index? It's urgent."
11:35 AM - DevOps: "Sure, let me ssh into production..."
11:37 AM - DevOps: "Wait, which migration file?"
11:40 AM - Developer: "The latest one"
11:42 AM - DevOps: "Running supabase db push..."
11:45 AM - DevOps: "Done!"
11:50 AM - Developer: "The index wasn't created?"
11:52 AM - DevOps: "Oh, I forgot to pull latest from git first..."
12:00 PM - DevOps: "Okay, running again..."
12:05 PM - Developer: "Still not working... did you link to prod?"
```

**Automated deployment:**

```
11:30 AM - Developer creates PR with migration
11:35 AM - Preview Branch deployed, migration tested
11:40 AM - Team reviews PR, approves
11:45 AM - Merge to main
11:46 AM - GitHub Action automatically applies migration to production
11:47 AM - Migration complete, index created
11:48 AM - Developer verifies: "Perfect, queries are fast now!"
```

**Key differences:**

- Manual: 35 minutes, multiple errors, stress
- Automated: 18 minutes, zero errors, confidence

</details>

### Setting Up GitHub Integration

**Prerequisites:**

- Remote Supabase project created
- GitHub repository for your codebase
- Supabase project linked locally

**Setup steps:**

1. **Go to Supabase Dashboard**

   - Navigate to your project
   - Go to "Settings" → "Integrations"

2. **Enable GitHub Integration**

   - Click "Connect to GitHub"
   - Authorize Supabase to access your repository
   - Select your repository
   - Set the Supabase directory path (usually `supabase/`)

3. **Configure Deployment Options**

   - ✅ **Enable "Deploy to production on push to main"**
   - ✅ **Enable "Preview Branches"** - Creates temporary environments for PRs
   - ✅ **Enable "Supabase changes only"** - Only deploy when Supabase files change

4. **Configure What Gets Deployed**

The GitHub integration automatically deploys:

- ✅ **New migrations** in `supabase/migrations/`
- ✅ **Edge functions** declared in `config.toml`
- ✅ **Storage buckets** declared in `config.toml`

**NOT deployed automatically (manual config changes):**

- ❌ API settings (CORS, rate limits)
- ❌ Auth providers (OAuth configuration)
- ❌ Seed files (production data is never auto-seeded)

<details>
<summary>Why aren't config changes auto-deployed?</summary>

**Configuration changes are different from schema changes:**

**Schema changes** (migrations):

- Versioned in git
- Applied sequentially
- Can be tested in Preview Branches
- Have clear rollback path

**Config changes** (API settings, auth providers):

- Often environment-specific (different OAuth keys in prod vs staging)
- Changes take effect immediately (no migration history)
- May require secrets that shouldn't be in git
- Often need manual verification

**Best practice:**

- Schema changes: Automate via migrations ✅
- Config changes: Manual review + deployment ✅

**Example:** You wouldn't want to accidentally deploy development Google OAuth credentials to production!

</details>

### The Preview Branch Workflow

When you enable Preview Branches, Supabase automatically:

1. **Creates a temporary database** for each PR
2. **Applies your migrations** to the preview database
3. **Comments on your PR** with the preview URL
4. **Deletes the preview** when the PR is closed

**Example workflow:**

```
1. Developer creates PR: "Add bookings table"
2. Supabase creates preview branch with unique URL
3. GitHub comment: "Preview deployed to: https://abcd1234.supabase.co"
4. Team reviews PR and tests against preview database
5. Tests pass, PR approved and merged to main
6. GitHub integration automatically applies migration to production
7. Preview branch automatically cleaned up
```

**Benefits:**

- Test migrations in isolated environment
- No risk to production data
- Multiple developers can work on different PRs simultaneously
- Catch migration issues before production

### Workflow Summary

**Development flow:**

```
1. Edit supabase/schemas/*.sql     # Declarative schema changes
2. bun db:diff <migration-name>    # Generate migration
3. Review generated SQL            # ALWAYS review!
4. supabase migration up           # Apply locally
5. bun gen:types                   # Regenerate types
6. Test your changes               # Verify it works
7. git commit + git push           # Deploy automatically
```

**What gets deployed:**

```
supabase/migrations/    → Applied to production database
supabase/functions/     → Deployed as Edge Functions
config.toml changes     → Updated configuration
```

**What stays local:**

```
supabase/seed/          → Local test data only
.env files              → Never committed
Local Supabase config   → Development only
```

## What's Next?

Congratulations! You now have a fully functional local development environment and understand the complete database development workflow.

### Follow the Interactive Setup Steps

Head over to **<http://localhost:3000>** and work through the interactive setup checklist on the landing page. This checklist mirrors the steps in this guide and tracks your progress using Zustand state management with localStorage persistence. Check off each step as you complete it!

The setup steps are organized into categories:

- **Initial Setup** - Clone, install, explore the codebase
- **Database Development** - Supabase setup, schema workflow, migrations
- **External Services** - Email, analytics, mapping services
- **Deployment** - GitHub integration and production deployment

### Things to Try

- **Explore the codebase** - Check out `app/page.tsx` for the landing page
- **Try the demo features** - Test the todos CRUD and profile pages
- **Read the docs** - Browse `docs/` for more detailed information
- **Check the database** - Use Supabase Studio to see how data is structured
- **Make changes** - Edit a component and watch it hot reload instantly
- **Build something** - Start replacing demo features with your own app logic

### Useful Development Commands

Here's a quick reference of commands you'll use frequently:

```bash
# Development
bun dev                    # Start the Next.js dev server
bun type:check             # Check TypeScript types across the whole project

# Database
bun db:start               # Start Supabase services
bun db:stop                # Stop Supabase services
bun db:reset               # Reset database and apply all migrations
bun db:diff <name>         # Create a new migration based on schema changes
bun gen:types              # Generate TypeScript types from database schema

# Seeding
bun seed                   # Run seed scripts to populate database
bun seed:sync              # Sync Snaplet with current database structure

# Supabase CLI
supabase status            # Show all running services and their URLs/keys
supabase db push           # Push local migrations to remote Supabase project
supabase migration list    # Show all migrations and their status
```

### Getting Help

If you run into issues:

1. **Check the logs** - Run `supabase logs` to see what's happening
2. **Verify services are running** - Run `supabase status`
3. **Reset everything** - Sometimes `supabase stop --no-backup && supabase start` fixes weird issues
4. **Check the docs** - Browse the `docs/` folder for detailed guides
5. **Ask the team** - We're here to help!

Happy coding! 🚀
