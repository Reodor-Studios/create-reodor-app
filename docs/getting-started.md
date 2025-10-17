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

### Other Important Directories

Beyond `app/` and `components/`, here are other key folders:

- **`lib/`** - External service configurations (Supabase, Stripe, email)
- **`server/`** - Server actions for data mutations
- **`stores/`** - Zustand stores for client state management
- **`hooks/`** - Custom React hooks
- **`types/`** - TypeScript type definitions
- **`schemas/`** - Zod schemas for validation (auto-generated from database)
- **`supabase/`** - Database migrations, schemas, and edge functions
- **`docs/`** - Project documentation (you're reading it now!)

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

## What's Next?

Congratulations! You now have a fully functional local development environment.

### Follow the Interactive Setup Steps

Head over to **<http://localhost:3000>** and work through the interactive setup checklist on the landing page. This checklist mirrors the steps in this guide and tracks your progress using Zustand state management with localStorage persistence. Check off each step as you complete it!

The setup steps are organized into categories:

- **Getting Started** - Clone, install, explore the codebase
- **Database & Configuration** - Supabase, environment variables, migrations
- **External Services** - Email, analytics, mapping services
- **Deployment** - Running locally and deploying to production

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
