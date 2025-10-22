"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { checkUserExists, sendWelcomeEmail } from "@/server/auth.actions";
import { normalizeNorwegianPhoneNumber } from "@/lib/utils";
export type AuthMode = "login" | "signup";
export type AuthStep = "email" | "code";

interface UseAuthFormProps {
  initialMode?: AuthMode;
  redirectTo?: string;
  onSuccess?: () => void;
}

export function useAuthForm({
  initialMode = "login",
  redirectTo,
  onSuccess,
}: UseAuthFormProps = {}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [usePasswordFlow, setUsePasswordFlow] = useState(
    process.env.NODE_ENV === "development",
  );
  const [resendCountdown, setResendCountdown] = useState(0);
  const [lastEmailSentTime, setLastEmailSentTime] = useState<number | null>(
    null,
  );
  const router = useRouter();

  // Handle countdown timer for resend button
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(
        () => setResendCountdown(resendCountdown - 1),
        1000,
      );
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const resetForm = () => {
    setEmail("");
    setFullName("");
    setPhoneNumber("");
    setPassword("");
    setOtpCode("");
    setStep("email");
    setError(null);
    setIsLoading(false);
    setIsSuccess(false);
    setResendCountdown(0);
    setLastEmailSentTime(null);
  };

  const handleModeSwitch = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  const handleResendEmail = useCallback(async () => {
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const emailRedirectTo = `${window.location.origin}/auth/confirm?next=${
        encodeURIComponent(redirectTo || "/")
      }`;

      if (mode === "signup") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo,
            shouldCreateUser: true,
            data: {
              full_name: fullName.trim(),
              phone_number: normalizeNorwegianPhoneNumber(phoneNumber.trim()),
            },
          },
        });

        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo,
            shouldCreateUser: false,
          },
        });

        if (error) throw error;
      }

      // Set countdown to 30 seconds after successful resend
      setResendCountdown(30);
      setLastEmailSentTime(Date.now());
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Kunne ikke sende e-post på nytt",
      );
    } finally {
      setIsLoading(false);
    }
  }, [email, fullName, mode, phoneNumber, redirectTo]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (!otpCode.trim() || otpCode.length !== 6) {
      setError("Vennligst skriv inn en 6-sifret kode");
      setIsLoading(false);
      return;
    }

    try {
      const { error, data } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: "email",
      });

      if (error) throw error;

      // Check if this is a new user signup and send welcome email + newsletter subscription
      if (data.user && mode === "signup") {
        // Get user profile to check if welcome email should be sent
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, role, created_at")
          .eq("id", data.user.id)
          .single();

        if (profile && data.user.email) {
          const accountAge = Date.now() -
            new Date(profile.created_at).getTime();
          const oneHourMs = 60 * 60 * 1000;

          if (accountAge < oneHourMs) {
            // Send welcome email asynchronously (don't wait for it)
            sendWelcomeEmail({
              email: data.user.email,
              userName: profile.full_name || undefined,
              userId: data.user.id,
            }).catch((error) => {
              console.error("[AUTH_FORM] Failed to send welcome email:", error);
            });
          }
        }
      }

      setIsSuccess(true);

      // Call success callback if provided (for dialog usage)
      if (onSuccess) {
        onSuccess();
      } else {
        // For standalone pages, redirect
        router.push(redirectTo || "/");
      }
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "Ugyldig kode. Prøv på nytt.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    // For signup mode, validate required fields
    if (mode === "signup") {
      if (
        process.env.NODE_ENV === "development" && usePasswordFlow &&
        password.trim()
      ) {
        // In development with password flow, only email and password are required
        if (!password.trim()) {
          setError("Passord er påkrevd");
          setIsLoading(false);
          return;
        }
      } else {
        // Normal signup requires full name and phone number
        if (!fullName.trim() || !phoneNumber.trim()) {
          setError("Alle feltene er påkrevd");
          setIsLoading(false);
          return;
        }
      }
    }

    try {
      const emailRedirectTo = `${window.location.origin}/auth/confirm?next=${
        encodeURIComponent(redirectTo || "/")
      }`;

      if (mode === "signup") {
        // Development-only: Create user with email and password
        if (
          process.env.NODE_ENV === "development" && usePasswordFlow &&
          password.trim()
        ) {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo,
              data: {
                full_name: fullName.trim() || "Development User",
                phone_number: normalizeNorwegianPhoneNumber(
                  phoneNumber.trim() || "+47 000 00 000",
                ),
              },
            },
          });

          if (error) {
            setError(error.message || "Kunne ikke opprette bruker");
            setIsLoading(false);
            return;
          }

          // In development, sign up should auto-confirm, so we can try to sign in immediately
          const { error: signInError } = await supabase.auth.signInWithPassword(
            {
              email,
              password,
            },
          );

          if (!signInError) {
            setIsSuccess(true);
            if (onSuccess) {
              onSuccess();
            } else {
              router.push(redirectTo || "/");
            }
            return;
          }
        } else {
          // For normal signup: Use signInWithOtp with shouldCreateUser: true to create new users
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo,
              shouldCreateUser: true,
              data: {
                full_name: fullName.trim(),
                phone_number: normalizeNorwegianPhoneNumber(phoneNumber.trim()),
              },
            },
          });

          if (error) {
            console.error("[AUTH_FORM] OTP signup failed:", error);
            throw error;
          }
        }
      } else {
        // For login: Try password authentication first (development only)
        if (
          process.env.NODE_ENV === "development" && usePasswordFlow &&
          password.trim()
        ) {
          console.log("Trying password authentication");
          const { error: passwordError } = await supabase.auth
            .signInWithPassword({
              email,
              password,
            });

          if (!passwordError) {
            // Password login succeeded
            setIsSuccess(true);
            if (onSuccess) {
              onSuccess();
            } else {
              router.push(redirectTo || "/");
            }
            return;
          } else {
            // Show password error only in development
            setError(
              passwordError.message || "Feil passord. Prøv på nytt.",
            );
            setIsLoading(false);
            return;
          }
        }

        // Check if user exists for OTP fallback
        const userCheck = await checkUserExists(email);

        if (userCheck.error) {
          throw new Error(userCheck.error);
        }

        if (!userCheck.exists) {
          setError(
            "Ingen bruker funnet med denne e-posten. Vennligst registrer deg først.",
          );
          setIsLoading(false);
          return;
        }

        // User exists, proceed with OTP login
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo,
            shouldCreateUser: false,
          },
        });

        if (error) throw error;
      }

      // Only transition to code step if not using password auth or password failed
      // For signup with password in development, we already handled success/failure above
      if (
        (process.env.NODE_ENV !== "development" || !usePasswordFlow ||
          !password.trim()) &&
        !(mode === "signup" && process.env.NODE_ENV === "development" &&
          usePasswordFlow && password.trim())
      ) {
        setStep("code");
        // Set countdown to 30 seconds after successful email send
        setResendCountdown(30);
        setLastEmailSentTime(Date.now());
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "En feil oppstod");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // State
    mode,
    step,
    email,
    fullName,
    phoneNumber,
    password,
    otpCode,
    error,
    isLoading,
    isSuccess,
    usePasswordFlow,
    resendCountdown,
    lastEmailSentTime,

    // Actions
    setMode,
    setStep,
    setEmail,
    setFullName,
    setPhoneNumber,
    setPassword,
    setOtpCode,
    setError,
    setIsLoading,
    setIsSuccess,
    setUsePasswordFlow,
    resetForm,
    handleModeSwitch,
    handleSubmit,
    handleVerifyOtp,
    handleResendEmail,
  };
}
