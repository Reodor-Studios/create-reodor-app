"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ErrorBoundaryProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  linkHref?: string;
  linkText?: string;
  onRetry?: () => void;
  showRetryButton?: boolean;
}

export function ErrorBoundary({
  icon: Icon = AlertTriangle,
  title,
  description,
  linkHref,
  linkText,
  onRetry,
  showRetryButton = true,
}: ErrorBoundaryProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <Card>
      <CardContent className="p-6 text-center py-12">
        <div className="space-y-4">
          <Icon className="w-12 h-12 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {description}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
            {showRetryButton && (
              <Button onClick={handleRetry} variant="outline">
                Prøv igjen
              </Button>
            )}
            {linkHref && linkText && (
              <Button asChild>
                <Link href={linkHref}>{linkText}</Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
