"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Eye,
  EyeOff,
  TestTube2,
  RefreshCw,
  Mail,
  Lightbulb,
} from "lucide-react";
import { useAuthForm, type AuthMode } from "./use-auth-form";
import { isValidNorwegianPhoneNumber } from "@/lib/utils";
import { GoogleSignInButton } from "./google-sign-in-button";
import { Spinner } from "../ui/spinner";

interface AuthFormProps {
  initialMode?: AuthMode;
  redirectTo?: string;
  onSuccess?: () => void;
  onModeChange?: (mode: AuthMode) => void;
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
}

export function AuthForm({
  initialMode = "login",
  redirectTo,
  onSuccess,
  onModeChange,
  labels = {},
}: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const {
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
    setEmail,
    setFullName,
    setPhoneNumber,
    setPassword,
    setOtpCode,
    setStep,
    setIsSuccess,
    setUsePasswordFlow,
    handleModeSwitch,
    handleSubmit,
    handleVerifyOtp,
    handleResendEmail,
  } = useAuthForm({ initialMode, redirectTo, onSuccess });

  const defaultLabels = {
    loginTitle: "Logg inn",
    signupTitle: "Registrer deg",
    loginDescription: "Skriv inn din e-post for å logge inn på kontoen din",
    signupDescription: "Opprett en ny konto med e-post-bekreftelse",
    loginButton: "Send påloggingslenke",
    signupButton: "Send bekreftelseslenke",
    loginLoadingButton: "Sender påloggingslenke...",
    signupLoadingButton: "Oppretter konto...",
    switchToSignup: "Opprett ny konto",
    switchToLogin: "Logg inn med eksisterende konto",
  };

  const finalLabels = { ...defaultLabels, ...labels };

  if (isSuccess) {
    return (
      <div className="flex flex-col gap-4 text-center py-4">
        <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950">
          <p className="text-sm text-green-800 dark:text-green-200">
            Du er nå logget inn!
          </p>
          <p className="mt-2 text-xs text-green-600 dark:text-green-400">
            Omdirigerer deg...
          </p>
        </div>
      </div>
    );
  }

  if (step === "code") {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Vi har sendt en 6-sifret kode til
          </p>
          <p className="font-medium">{email}</p>
          <p className="text-sm text-muted-foreground">
            Skriv inn koden i e-posten
          </p>
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 flex-shrink-0" />{" "}
              <div>
                <strong>Tips:</strong> Sjekk spam-mappen din hvis du ikke ser
                e-posten
              </div>
            </p>
          </div>
        </div>

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="otp-code">Bekreftelseskode</Label>
            <Input
              id="otp-code"
              type="text"
              placeholder="123456"
              required
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              className="text-center text-lg tracking-widest"
              autoComplete="one-time-code"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Spinner className="mr-2 h-4 w-4" />}
            {isLoading ? "Bekrefter..." : "Bekreft kode"}
          </Button>
        </form>

        {/* Resend email section */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <p className="text-sm text-muted-foreground">
            Ikke mottatt e-posten?
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResendEmail}
            disabled={isLoading || resendCountdown > 0}
            className="gap-2"
          >
            {resendCountdown > 0 ? (
              <>
                <RefreshCw className="h-4 w-4" />
                Send på nytt om {resendCountdown}s
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Send e-post på nytt
              </>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs uppercase text-muted-foreground">eller</span>
          <Separator className="flex-1" />
        </div>

        <div className="space-y-2">
          <Button
            variant="outline"
            onClick={() => {
              setStep("email");
              setOtpCode("");
            }}
            className="w-full"
          >
            Tilbake til e-post
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              const newMode = mode === "login" ? "signup" : "login";
              handleModeSwitch(newMode);
              onModeChange?.(newMode);
            }}
            className="w-full"
            size="sm"
          >
            {mode === "login"
              ? finalLabels.switchToSignup
              : finalLabels.switchToLogin}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Development-only toggle for auth flow */}
      {process.env.NODE_ENV === "development" && (
        <div className="rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50 p-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <TestTube2 className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium text-foreground">
                Utviklingsmodus
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="password-flow-toggle"
                className="text-xs text-muted-foreground"
              >
                {usePasswordFlow ? "Passord-flyt" : "E-post-flyt"}
              </Label>
              <Switch
                id="password-flow-toggle"
                checked={usePasswordFlow}
                onCheckedChange={(checked) => {
                  setUsePasswordFlow(checked);
                }}
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {usePasswordFlow
              ? "Bruker passord for rask testing med seed-brukere"
              : "Bruker e-post-bekreftelse for fullstendig flyt"}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div className="grid gap-2">
            <Label htmlFor="full-name" className="flex items-center gap-2">
              Fullt navn
              {process.env.NODE_ENV === "development" &&
                usePasswordFlow &&
                password && (
                  <span className="text-xs text-muted-foreground">
                    (valgfritt i utvikling)
                  </span>
                )}
            </Label>
            <Input
              id="full-name"
              type="text"
              placeholder="Ola Nordmann"
              required={
                !(
                  process.env.NODE_ENV === "development" &&
                  usePasswordFlow &&
                  password
                )
              }
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="email">E-post</Label>
          <Input
            id="email"
            type="email"
            placeholder="ola@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Development-only password field for testing */}
        {process.env.NODE_ENV === "development" && usePasswordFlow && (
          <div className="grid gap-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              Passord
              <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded">
                Kun utvikling
              </span>
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    mode === "login"
                      ? "Passord for test-brukere"
                      : "Velg et passord"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required={mode === "signup"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
              </div>
              {mode === "login" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPassword("demo-password")}
                  className="whitespace-nowrap"
                >
                  Fyll inn
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {mode === "login"
                ? "For test-brukere: kari.nordmann@example.com, ole.hansen@example.com, etc."
                : "Dette vil opprette en bruker med kjent passord for testing"}
            </p>
          </div>
        )}

        {mode === "signup" && (
          <div className="grid gap-2">
            <Label htmlFor="phone-number" className="flex items-center gap-2">
              Telefonnummer
              {process.env.NODE_ENV === "development" &&
                usePasswordFlow &&
                password && (
                  <span className="text-xs text-muted-foreground">
                    (valgfritt i utvikling)
                  </span>
                )}
            </Label>
            <Input
              id="phone-number"
              type="tel"
              placeholder="+47 123 45 678"
              required={
                !(
                  process.env.NODE_ENV === "development" &&
                  usePasswordFlow &&
                  password
                )
              }
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className={
                phoneNumber && !isValidNorwegianPhoneNumber(phoneNumber)
                  ? "border-red-500 focus:border-red-500"
                  : ""
              }
            />
            {phoneNumber && !isValidNorwegianPhoneNumber(phoneNumber) && (
              <p className="text-xs text-red-600">
                Skriv inn et gyldig norsk telefonnummer (f.eks. +47 123 45 678,
                12345678)
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Aksepterer alle vanlige norske formater
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            {error.includes("Ingen bruker funnet") && (
              <div className="mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newMode = "signup";
                    handleModeSwitch(newMode);
                    onModeChange?.(newMode);
                  }}
                  className="w-full border-red-200 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900"
                >
                  Registrer deg i stedet
                </Button>
              </div>
            )}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Spinner className="mr-2 h-4 w-4" />}
          {isLoading
            ? mode === "login"
              ? finalLabels.loginLoadingButton
              : finalLabels.signupLoadingButton
            : mode === "login"
              ? finalLabels.loginButton
              : finalLabels.signupButton}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs uppercase text-muted-foreground">eller</span>
        <Separator className="flex-1" />
      </div>

      <GoogleSignInButton redirectTo={redirectTo} disabled={isLoading} />

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs uppercase text-muted-foreground">eller</span>
        <Separator className="flex-1" />
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => {
          const newMode = mode === "login" ? "signup" : "login";
          handleModeSwitch(newMode);
          onModeChange?.(newMode);
        }}
        className="w-full"
      >
        {mode === "login"
          ? finalLabels.switchToSignup
          : finalLabels.switchToLogin}
      </Button>
    </div>
  );
}
