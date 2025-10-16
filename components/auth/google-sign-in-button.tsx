"use client";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

interface GoogleSignInButtonProps {
  redirectTo?: string;
  disabled?: boolean;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
  className?: string;
}

export function GoogleSignInButton({
  redirectTo,
  disabled = false,
  size = "default",
  variant = "outline",
  className = "",
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    const supabase = createClient();
    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/auth/oauth?next=${encodeURIComponent(redirectTo || "/")}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        toast.error("Kunne ikke logge inn med Google");
        setIsLoading(false);
      }
    } catch (error) {
      toast.error("En feil oppstod under innlogging");
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleGoogleSignIn}
      disabled={disabled || isLoading}
      className={`w-full ${className}`}
    >
      <Icons.google className="mr-2 h-4 w-4" />
      Fortsett med Google
    </Button>
  );
}
