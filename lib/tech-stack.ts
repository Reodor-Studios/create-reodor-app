export interface TechStackItem {
  name: string;
  description: string;
  website: string;
  logo: string; // Path to logo in public/logos/
  category:
    | "frontend"
    | "backend"
    | "database"
    | "ui"
    | "deployment"
    | "state"
    | "validation"
    | "email"
    | "analytics"
    | "payment"
    | "runtime";
}

export const TECH_STACK: TechStackItem[] = [
  // Frontend Framework
  {
    name: "Next.js",
    description: "React framework with App Router",
    website: "https://nextjs.org",
    logo: "/logos/nextjs.svg",
    category: "frontend",
  },
  {
    name: "React",
    description: "UI library",
    website: "https://react.dev",
    logo: "/logos/react.svg",
    category: "frontend",
  },
  {
    name: "TypeScript",
    description: "Type-safe JavaScript",
    website: "https://www.typescriptlang.org",
    logo: "/logos/typescript.svg",
    category: "frontend",
  },

  // Backend & Database
  {
    name: "Supabase",
    description: "Backend-as-a-Service (PostgreSQL, Auth, Storage)",
    website: "https://supabase.com",
    logo: "/logos/supabase.svg",
    category: "backend",
  },

  // State Management & Data Fetching
  {
    name: "TanStack Query",
    description: "Powerful data fetching and caching",
    website: "https://tanstack.com/query/latest",
    logo: "/logos/tanstack-query.svg",
    category: "state",
  },
  {
    name: "Zustand",
    description: "Lightweight state management",
    website: "https://zustand.docs.pmnd.rs",
    logo: "/logos/zustand.png",
    category: "state",
  },

  // Form & Validation
  {
    name: "React Hook Form",
    description: "Performant form library",
    website: "https://react-hook-form.com",
    logo: "/logos/react-hook-form.svg",
    category: "validation",
  },
  {
    name: "Zod",
    description: "TypeScript-first schema validation",
    website: "https://zod.dev",
    logo: "/logos/zod.webp",
    category: "validation",
  },

  // UI & Styling
  {
    name: "Tailwind CSS",
    description: "Utility-first CSS framework",
    website: "https://tailwindcss.com",
    logo: "/logos/tailwind.svg",
    category: "ui",
  },
  {
    name: "shadcn/ui",
    description: "Beautifully designed components",
    website: "https://ui.shadcn.com",
    logo: "/logos/shadcn.svg",
    category: "ui",
  },
  {
    name: "Radix UI",
    description: "Unstyled, accessible components",
    website: "https://www.radix-ui.com",
    logo: "/logos/radix.svg",
    category: "ui",
  },

  // Email
  {
    name: "Resend",
    description: "Email API for developers",
    website: "https://resend.com",
    logo: "/logos/resend.svg",
    category: "email",
  },
  {
    name: "React Email",
    description: "Email templates with React",
    website: "https://react.email",
    logo: "/logos/react-email.webp",
    category: "email",
  },

  // External Services
  {
    name: "Stripe",
    description: "Payment processing platform",
    website: "https://stripe.com",
    logo: "/logos/stripe.svg",
    category: "payment",
  },
  {
    name: "PostHog",
    description: "Product analytics and feature flags",
    website: "https://posthog.com",
    logo: "/logos/posthog.svg",
    category: "analytics",
  },

  // Deployment & Runtime
  {
    name: "Vercel",
    description: "Frontend cloud platform",
    website: "https://vercel.com",
    logo: "/logos/vercel.svg",
    category: "deployment",
  },
  {
    name: "Bun",
    description: "Fast JavaScript runtime",
    website: "https://bun.sh",
    logo: "/logos/bun.svg",
    category: "runtime",
  },
];

// Helper function to get tech stack by category
export function getTechStackByCategory(
  category: TechStackItem["category"],
): TechStackItem[] {
  return TECH_STACK.filter((item) => item.category === category);
}

// Helper function to get all categories
export function getAllCategories(): TechStackItem["category"][] {
  return Array.from(new Set(TECH_STACK.map((item) => item.category)));
}
