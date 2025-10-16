"use client";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { AuthForm } from "./auth-form";
import type { AuthMode } from "./use-auth-form";

interface AuthCardProps {
  className?: string;
  initialMode?: AuthMode;
  redirectTo?: string;
  onSuccess?: () => void;
  labels?: {
    loginTitle?: string;
    signupTitle?: string;
    loginDescription?: string;
    signupDescription?: string;
    loginButton?: string;
    signupButton?: string;
    loginLoadingButton?: string;
    signupLoadingButton?: string;
    switchToSignup?: string;
    switchToLogin?: string;
  };
  showModeLinks?: boolean;
}

export function AuthCard({
  className,
  initialMode = "login",
  redirectTo,
  onSuccess,
  labels = {},
  showModeLinks = true,
  ...props
}: AuthCardProps) {
  const defaultLabels = {
    loginTitle: "Logg inn",
    signupTitle: "Registrer deg",
    loginDescription: "Skriv inn din e-post for å logge inn på kontoen din",
    signupDescription: "Opprett en ny konto med e-post-bekreftelse",
  };

  const finalLabels = { ...defaultLabels, ...labels };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {initialMode === "login" ? finalLabels.loginTitle : finalLabels.signupTitle}
          </CardTitle>
          <CardDescription>
            {initialMode === "login" ? finalLabels.loginDescription : finalLabels.signupDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm
            initialMode={initialMode}
            redirectTo={redirectTo}
            onSuccess={onSuccess}
            labels={labels}
          />
          
          {showModeLinks && (
            <div className="mt-4 text-center text-sm">
              {initialMode === "login" ? (
                <>
                  Har du ikke en konto?{" "}
                  <Link
                    href="/auth/sign-up"
                    className="underline underline-offset-4"
                  >
                    Registrer deg
                  </Link>
                </>
              ) : (
                <>
                  Har du allerede en konto?{" "}
                  <Link
                    href="/auth/login"
                    className="underline underline-offset-4"
                  >
                    Logg inn
                  </Link>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}