import { AuthCard } from "@/components/auth";

interface PageProps {
  searchParams: Promise<{
    redirectTo?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { redirectTo } = await searchParams;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <AuthCard initialMode="signup" redirectTo={redirectTo} />
      </div>
    </div>
  );
}
