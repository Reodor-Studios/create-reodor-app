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
        policies, and functions using <InlineCode>bun run db:push</InlineCode>{" "}
        or Supabase CLI.
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
      </>
    ),
    category: "deployment",
  },
  {
    id: "deploy-vercel",
    title: "Deploy to Vercel",
    description: (
      <>
        Deploy your application to Vercel. Connect your GitHub repository and
        configure environment variables in Vercel dashboard.
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
        return get().getSteps().filter((step) => step.category === category);
      },
    }),
    {
      name: "create-reodor-app:setup-steps-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
