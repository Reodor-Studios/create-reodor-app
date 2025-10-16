import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, Home, Mail, RefreshCw } from "lucide-react";
import Link from "next/link";
import { companyConfig } from "@/lib/brand";

export default function AccountDeletionErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; message?: string }>;
}) {
  return <AccountDeletionErrorContent searchParams={searchParams} />;
}

async function AccountDeletionErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; message?: string }>;
}) {
  const { reason, message } = await searchParams;

  const getErrorDetails = () => {
    switch (reason) {
      case "token_expired":
        return {
          title: "Lenke utløpt",
          description:
            "Bekreftelseslenken er utløpt. Lenker for sletting av konto er gyldig i 24 timer.",
          action: "Be om en ny bekreftelseslenke fra din profil.",
        };
      case "token_invalid":
        return {
          title: "Ugyldig lenke",
          description: "Bekreftelseslenken er ugyldig eller har blitt endret.",
          action: "Be om en ny bekreftelseslenke fra din profil.",
        };
      case "deletion_failed":
        return {
          title: "Sletting mislyktes",
          description: "En teknisk feil oppstod under sletting av kontoen din.",
          action: "Vennligst prøv igjen senere eller kontakt kundeservice.",
        };
      case "user_not_found":
        return {
          title: "Bruker ikke funnet",
          description:
            "Kontoen som skulle slettes ble ikke funnet. Den kan allerede være slettet.",
          action: "Hvis du mener dette er en feil, kontakt kundeservice.",
        };
      default:
        return {
          title: "Feil ved sletting",
          description:
            message || "En ukjent feil oppstod under sletting av kontoen din.",
          action: "Vennligst prøv igjen senere eller kontakt kundeservice.",
        };
    }
  };

  const errorDetails = getErrorDetails();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Card className="border-destructive/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-destructive">
              {errorDetails.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {errorDetails.description}
              </p>

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-foreground">
                  <strong>Neste steg:</strong> {errorDetails.action}
                </p>
              </div>

              {reason === "deletion_failed" || reason === "token_expired" ? (
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Prøv igjen
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Du kan prøve å slette kontoen din på nytt fra din
                        profil.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-3 pt-4">
              <div className="space-y-2">
                <Button asChild className="w-full" variant="outline">
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    Gå til forsiden
                  </Link>
                </Button>

                {reason === "deletion_failed" || reason === "token_expired" ? (
                  <Button asChild className="w-full" variant="default">
                    <Link href="/profiler">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Prøv igjen fra profil
                    </Link>
                  </Button>
                ) : null}

                <Button asChild className="w-full" variant="ghost" size="sm">
                  <Link href={`mailto:${companyConfig.supportEmail}`}>
                    <Mail className="w-4 h-4 mr-2" />
                    Kontakt kundeservice
                  </Link>
                </Button>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  <strong>Feilkode:</strong> {reason || "unknown"}
                </p>
                {message && (
                  <p>
                    <strong>Detaljer:</strong> {message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
