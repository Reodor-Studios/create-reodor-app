"use client";

import { useEffect } from "react";
import { ErrorBoundary } from "@/components/error-boundary";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App root error:", error);
  }, [error]);

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <ErrorBoundary
            title="Noe gikk galt"
            description="En uventet feil oppstod. Prøv å laste siden på nytt, eller gå tilbake til forsiden."
            linkHref="/"
            linkText="Gå til forsiden"
            onRetry={reset}
          />
        </div>
      </div>
    </>
  );
}
