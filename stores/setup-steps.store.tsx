import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { InlineCode } from "@/components/ui/inline-code";

export interface SetupStep {
  id: string;
  title: string;
  description: React.ReactNode;
  category: "initial" | "database" | "services" | "deployment";
  completed: boolean;
}

export interface SetupStepsStore {
  completedSteps: Record<string, boolean>;

  // Actions
  toggleStep: (stepId: string) => void;
  resetSteps: () => void;
  getCompletedCount: () => number;
  getTotalCount: () => number;
  getProgressPercentage: () => number;
  getStepsByCategory: (category: SetupStep["category"]) => SetupStep[];
  getSteps: () => SetupStep[];
}

// Static step definitions (not persisted, contains JSX)
const stepDefinitions: Omit<SetupStep, "completed">[] = [
  {
    id: "clone-repo",
    title: "Clone the Repository",
    description: (
      <>
        Clone the create-reodor-app repository to your local machine and
        navigate to the project directory.
      </>
    ),
    category: "initial",
  },
  {
    id: "install-deps",
    title: "Install Dependencies",
    description: (
      <>
        Run <InlineCode>bun install</InlineCode> to install all project
        dependencies. This includes Next.js, React, Supabase SDK, and other
        dependencies. Take a look in <InlineCode>package.json</InlineCode>.
      </>
    ),
    category: "initial",
  },
  {
    id: "explore-app-structure",
    title: "Explore the App Directory",
    description: (
      <>
        Open the <InlineCode>app/</InlineCode> directory and familiarize
        yourself with Next.js App Router structure. This is where all your
        pages, layouts, and route handlers live. The folder structure directly
        maps to URL routes.
      </>
    ),
    category: "initial",
  },
  {
    id: "review-auth-flows",
    title: "Review Authentication Flows",
    description: (
      <>
        Check out <InlineCode>app/auth/</InlineCode> to see sign-up, sign-in,
        email confirmation, and account deletion pages. These demonstrate how
        Supabase Auth integrates with Next.js App Router and server actions.
      </>
    ),
    category: "initial",
  },
  {
    id: "understand-api-routes",
    title: "Understand API Routes",
    description: (
      <>
        Explore <InlineCode>app/api/</InlineCode> for route handlers. These are
        serverless functions that handle backend logic like webhooks, cron jobs,
        and external service integrations. Each route exports HTTP method
        handlers.
      </>
    ),
    category: "initial",
  },
  {
    id: "check-demo-features",
    title: "Explore Demo Features",
    description: (
      <>
        Review <InlineCode>app/oppgaver/</InlineCode> (todos) and{" "}
        <InlineCode>app/profiler/</InlineCode> (profiles) to see complete CRUD
        implementations. These demonstrate TanStack Query, server actions, form
        validation, and Row Level Security patterns.
      </>
    ),
    category: "initial",
  },
  {
    id: "review-static-pages",
    title: "Review Static Pages",
    description: (
      <>
        Browse static pages like <InlineCode>app/faq/</InlineCode>,{" "}
        <InlineCode>app/privacy/</InlineCode>, and{" "}
        <InlineCode>app/terms/</InlineCode>. Every production app needs these
        legal and informational pages for compliance and user trust.
      </>
    ),
    category: "initial",
  },
  {
    id: "understand-seo-config",
    title: "Understand SEO Configuration",
    description: (
      <>
        Check out <InlineCode>app/robots.ts</InlineCode> and{" "}
        <InlineCode>app/sitemap.ts</InlineCode>. These files dynamically
        generate robots.txt and sitemap.xml to help search engines crawl your
        site effectively and respect your privacy preferences.
      </>
    ),
    category: "initial",
  },
  {
    id: "explore-components",
    title: "Explore the Components Directory",
    description: (
      <>
        Browse <InlineCode>components/</InlineCode> to see how components are
        organized by feature (auth, todos, admin, nav) and by UI library (ui/
        for shadcn/ui, kibo-ui/ for Kibo UI). Shared components like navbar,
        footer, and forms live at the root level. This structure makes finding
        and reusing components intuitive.
      </>
    ),
    category: "initial",
  },
  {
    id: "explore-docs",
    title: "Explore the Documentation Directory",
    description: (
      <>
        Check out <InlineCode>docs/</InlineCode> to see how project
        documentation is organized. The <InlineCode>business/</InlineCode>{" "}
        folder contains feature specs and user workflows, while{" "}
        <InlineCode>technical/</InlineCode> holds implementation details and
        architecture decisions. This documentation makes working with AI
        assistants much easier—drag in a doc file to provide full context!
      </>
    ),
    category: "initial",
  },
  {
    id: "explore-hooks",
    title: "Explore the Hooks Directory",
    description: (
      <>
        Browse <InlineCode>hooks/</InlineCode> for custom React hooks like{" "}
        <InlineCode>useAuth</InlineCode> and file upload utilities. Note that
        this project uses client-side file uploads with browser-based image
        compression before uploading to Supabase Storage—this reduces bandwidth
        by 70-90% and provides instant user feedback.
      </>
    ),
    category: "initial",
  },
  {
    id: "explore-lib",
    title: "Explore the Lib Directory",
    description: (
      <>
        Check out <InlineCode>lib/</InlineCode> for external service
        configurations and utility functions. Key files include{" "}
        <InlineCode>supabase/</InlineCode> for database config,{" "}
        <InlineCode>brand.ts</InlineCode> for company branding, and{" "}
        <InlineCode>utils.ts</InlineCode> for runtime-agnostic utility
        functions.
      </>
    ),
    category: "initial",
  },
  {
    id: "explore-providers",
    title: "Understand the Providers Directory",
    description: (
      <>
        Take a quick look at <InlineCode>providers/</InlineCode> to see how
        React context providers are organized. These wrap your app in{" "}
        <InlineCode>app/layout.tsx</InlineCode> and are rarely modified after
        initial setup. Currently includes TanStack Query provider—future
        additions might include PostHog analytics or feature flag providers.
      </>
    ),
    category: "initial",
  },
  {
    id: "explore-database-setup",
    title: "Explore Database Setup",
    description: (
      <>
        Examine <InlineCode>supabase/schemas/</InlineCode> for declarative SQL
        schemas, <InlineCode>seed/</InlineCode> for test data generation, and{" "}
        <InlineCode>schemas/database.schema.ts</InlineCode> for autogenerated
        Zod schemas. Learn how database changes flow from SQL → TypeScript
        types → Zod schemas, and how seed scripts help test edge cases before
        production.
      </>
    ),
    category: "initial",
  },
  {
    id: "setup-supabase",
    title: "Set Up Supabase Project",
    description: (
      <>
        Create a new Supabase project at <InlineCode>supabase.com</InlineCode>.
        Copy your project URL and anon key for environment configuration.
      </>
    ),
    category: "database",
  },
  {
    id: "configure-env",
    title: "Configure Environment Variables",
    description: (
      <>
        Copy <InlineCode>.env.example</InlineCode> to{" "}
        <InlineCode>.env.local</InlineCode> and fill in all required variables
        including Supabase and other service credentials.
      </>
    ),
    category: "database",
  },
  {
    id: "run-migrations",
    title: "Run Database Migrations",
    description: (
      <>
        Execute Supabase migrations to set up your database schema, RLS
        policies, and functions using <InlineCode>bun db:reset</InlineCode> or{" "}
        <InlineCode>supabase migration up</InlineCode>. Learn more in the{" "}
        <a
          href="https://supabase.com/docs/guides/local-development"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          local development guide
        </a>
        .
      </>
    ),
    category: "database",
  },
  {
    id: "link-remote-supabase",
    title: "Link to Remote Supabase (Optional)",
    description: (
      <>
        While you can develop entirely locally, linking your local environment
        to a remote Supabase project enables database schema synchronization.
        Run <InlineCode>supabase login</InlineCode>, then{" "}
        <InlineCode>supabase link --project-ref &lt;your-ref&gt;</InlineCode>.
        See the{" "}
        <a
          href="https://supabase.com/docs/guides/local-development/cli/getting-started"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          CLI guide
        </a>{" "}
        for details.
      </>
    ),
    category: "database",
  },
  {
    id: "understand-db-workflow",
    title: "Understand Database Development Workflow",
    description: (
      <>
        Learn the critical database workflow: modify schema files (
        <InlineCode>supabase/schemas/*.sql</InlineCode>), generate migrations (
        <InlineCode>bun db:diff</InlineCode>), review generated SQL, apply
        locally (<InlineCode>supabase migration up</InlineCode>), regenerate
        types (<InlineCode>bun gen:types</InlineCode>), test, and deploy. This
        declarative approach keeps your schema files as the single source of
        truth. Read the full workflow in{" "}
        <InlineCode>docs/getting-started.md</InlineCode>.
      </>
    ),
    category: "database",
  },
  {
    id: "setup-resend",
    title: "Configure Email Service",
    description: (
      <>
        Create a Resend account and get your API key. Configure email templates
        and sender domains for transactional emails.
      </>
    ),
    category: "services",
  },
  {
    id: "setup-posthog",
    title: "Set Up PostHog Analytics",
    description: (
      <>
        Create a PostHog project for analytics and error tracking. Add the
        PostHog API key to your environment variables.
      </>
    ),
    category: "services",
  },
  {
    id: "setup-mapbox",
    title: "Configure Mapbox",
    description: (
      <>
        Get a Mapbox access token for address autocomplete and geographical
        features. Add it to your environment variables.
      </>
    ),
    category: "services",
  },
  {
    id: "run-dev-server",
    title: "Run Development Server",
    description: (
      <>
        Start the development server with <InlineCode>bun run dev</InlineCode>{" "}
        and verify everything works at <InlineCode>localhost:3000</InlineCode>.
        Test authentication, database queries, and all features work correctly.
      </>
    ),
    category: "deployment",
  },
  {
    id: "setup-github-integration",
    title: "Set Up GitHub Integration for Supabase",
    description: (
      <>
        Enable automatic database deployments by connecting your Supabase
        project to GitHub. This allows migrations to deploy automatically when
        you push to main, creates Preview Branches for PRs, and provides full
        audit trail. Go to Supabase Dashboard → Settings → Integrations →
        Connect to GitHub. See{" "}
        <a
          href="https://supabase.com/docs/guides/deployment/branching/github-integration"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          GitHub integration docs
        </a>
        .
      </>
    ),
    category: "deployment",
  },
  {
    id: "understand-automated-deployments",
    title: "Understand Automated Database Deployments",
    description: (
      <>
        Learn why automated deployments are critical: they provide safety
        through PR reviews, consistency with no human error, full audit trail in
        git, Preview Branches for testing, and easy rollback. Manual deployments
        are error-prone and risky in production. Read the detailed explanation
        in <InlineCode>docs/getting-started.md</InlineCode> about why automation
        matters and how it works.
      </>
    ),
    category: "deployment",
  },
  {
    id: "deploy-vercel",
    title: "Deploy to Vercel (Optional)",
    description: (
      <>
        Deploy your Next.js application to Vercel for production hosting.
        Connect your GitHub repository, configure environment variables in
        Vercel dashboard, and enable automatic deployments on push to main.
      </>
    ),
    category: "deployment",
  },
];

export const useSetupStepsStore = create<SetupStepsStore>()(
  persist(
    (set, get) => ({
      // Only persist completion status
      completedSteps: {},

      // Merge static definitions with persisted completion status
      getSteps: () => {
        const { completedSteps } = get();
        return stepDefinitions.map((step) => ({
          ...step,
          completed: completedSteps[step.id] ?? false,
        }));
      },

      toggleStep: (stepId) => {
        set((state) => ({
          completedSteps: {
            ...state.completedSteps,
            [stepId]: !state.completedSteps[stepId],
          },
        }));
      },

      resetSteps: () => {
        set({ completedSteps: {} });
      },

      getCompletedCount: () => {
        return Object.values(get().completedSteps).filter(Boolean).length;
      },

      getTotalCount: () => {
        return stepDefinitions.length;
      },

      getProgressPercentage: () => {
        const total = get().getTotalCount();
        const completed = get().getCompletedCount();
        return total > 0 ? Math.round((completed / total) * 100) : 0;
      },

      getStepsByCategory: (category) => {
        return get()
          .getSteps()
          .filter((step) => step.category === category);
      },
    }),
    {
      name: "create-reodor-app:setup-steps-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
