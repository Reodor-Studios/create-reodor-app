"use client";

import { useEffect } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { Shield } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <ErrorBoundary
            icon={Shield}
            title="Administratorfeil"
            description="En feil oppstod i administrasjonspanelet. Prøv å laste siden på nytt eller kontakt support hvis problemet vedvarer."
            linkHref="/"
            linkText="Gå til forsiden"
            onRetry={reset}
          />
        </div>
      </div>
    </>
  );
}
