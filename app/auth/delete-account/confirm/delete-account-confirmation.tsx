"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  verifyAccountDeletionToken,
  deleteUserAccount,
} from "@/server/auth.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import { companyConfig } from "@/lib/brand";

type TokenPayload = {
  userId: string;
  purpose: string;
  iat: number;
  exp: number;
};

type VerificationState =
  | { status: "loading" }
  | { status: "invalid"; error: string }
  | { status: "valid"; payload: TokenPayload }
  | { status: "deleting" }
  | { status: "success" }
  | { status: "error"; error: string };

export function DeleteAccountConfirmation() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verificationState, setVerificationState] = useState<VerificationState>(
    { status: "loading" }
  );
  const [confirmationText, setConfirmationText] = useState("");

  const deleteMyUserText = "slett min bruker";

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get("token");
      const userId = searchParams.get("userId");

      if (!token || !userId) {
        setVerificationState({
          status: "invalid",
          error: "Ugyldig lenke. Lenken mangler nødvendige parametere.",
        });
        return;
      }

      try {
        const result = await verifyAccountDeletionToken({ token, userId });

        const userIdFromToken = result.payload?.userId;
        const expiryFromToken = result.payload?.exp;

        if (!result.valid || !userIdFromToken || !expiryFromToken) {
          setVerificationState({
            status: "invalid",
            error: result.error || "Ugyldig lenke",
          });
          return;
        }

        const payload = result.payload;

        if (!payload) {
          setVerificationState({
            status: "invalid",
            error: "Ugyldig lenke",
          });
          return;
        }

        setVerificationState({
          status: "valid",
          payload: result.payload,
        });
      } catch (error) {
        console.error("[DELETE_CONFIRM] Token verification failed:", error);
        setVerificationState({
          status: "invalid",
          error:
            "Ugyldig eller utløpt lenke. Vennligst be om en ny lenke fra din profil.",
        });
      }
    };

    verifyToken();
  }, [searchParams]);

  const handleDeleteAccount = async () => {
    if (verificationState.status !== "valid") return;
    if (confirmationText !== deleteMyUserText) {
      alert(`Du må skrive '${deleteMyUserText}' for å bekrefte sletting`);
      return;
    }

    const token = searchParams.get("token");
    const userId = searchParams.get("userId");

    if (!token || !userId) {
      setVerificationState({
        status: "error",
        error: "Manglende parametere for sletting",
      });
      return;
    }

    setVerificationState({ status: "deleting" });

    try {
      const result = await deleteUserAccount({ token, userId });

      if (!result.success) {
        // Redirect to error page with specific error information
        if (result.redirectTo) {
          router.push(result.redirectTo);
          return;
        }

        setVerificationState({
          status: "error",
          error: result.error || "En feil oppstod under sletting av kontoen",
        });
        return;
      }

      // Redirect to success page
      if (result.redirectTo) {
        router.push(result.redirectTo);
      } else {
        router.push("/auth/delete-account/success");
      }
    } catch (error) {
      console.error(
        "[DELETE_CONFIRM] Unexpected error during account deletion:",
        error
      );
      setVerificationState({
        status: "error",
        error:
          "En uventet feil oppstod under sletting av kontoen. Vennligst prøv igjen senere.",
      });
    }
  };

  // Helper variables for button states
  const isDeleting = verificationState.status === "deleting";
  const isValid = verificationState.status === "valid";
  const canDelete = isValid && confirmationText === deleteMyUserText;

  // Loading state
  if (verificationState.status === "loading") {
    return (
      <Card className="text-center">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            <Spinner className="h-8 w-8 text-primary" />
            <p className="text-muted-foreground">Verifiserer lenke...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Invalid token state
  if (verificationState.status === "invalid") {
    return (
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="w-5 h-5" />
            Ugyldig lenke
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {verificationState.error}
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Tilbake til forsiden
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Hvis du ønsker å slette kontoen din, kan du gjøre det fra din
              profil.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state
  if (verificationState.status === "success") {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <CheckCircle className="w-5 h-5" />
            Konto slettet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-green-700 dark:text-green-300">
            Din konto er nå permanent slettet. Du vil motta en bekreftelse via
            e-post.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Til forsiden</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (verificationState.status === "error") {
    return (
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="w-5 h-5" />
            Feil ved sletting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {verificationState.error}
          </p>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Prøv igjen
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Avbryt og gå til forsiden
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Valid token - show confirmation form
  if (verificationState.status !== "valid") {
    return null; // This should never happen, but TypeScript needs it
  }

  const payload = verificationState.payload;
  const expiresAt = new Date(payload.exp * 1000);

  return (
    <div className="space-y-6">
      {/* Warning Card */}
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-destructive">Siste advarsel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Du er i ferd med å permanent slette din {companyConfig.name}-konto. Denne
              handlingen kan ikke angres.
            </p>

            <div className="bg-destructive/5 rounded-lg p-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-destructive">
                  Dette vil bli slettet permanent:
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside text-left">
                  <li>Din personlige profil og kontoinformasjon</li>
                  <li>Alle dine bestillinger og historikk</li>
                  <li>Meldinger og samtaler</li>
                  <li>Anmeldelser og vurderinger du har gitt</li>
                  <li>Lagrede betalingsmetoder og adresser</li>
                </ul>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label htmlFor="confirmation-text" className="text-sm">
              Skriv <span className="font-semibold">{deleteMyUserText}</span>{" "}
              for å bekrefte:
            </Label>
            <Input
              id="confirmation-text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={deleteMyUserText}
              className="border-destructive/50 focus:border-destructive"
            />
          </div>

          <div className="space-y-3 pt-4">
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={!canDelete || isDeleting}
              className="w-full"
            >
              {isDeleting ? (
                <>
                  <Spinner className="h-4 w-4 text-white mr-2" />
                  Sletter konto...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Slett min konto permanent
                </>
              )}
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Avbryt - jeg har ombestemt meg
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Token Info */}
      <Card>
        <CardContent className="pt-4">
          <div className="text-xs text-muted-foreground space-y-1 text-center">
            <p>Denne lenken utløper: {expiresAt.toLocaleString("nb-NO")}</p>
            <p>Bruker-ID: {payload.userId.substring(0, 8)}...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
