"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Home, Mail } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { companyConfig } from "@/lib/brand";

export default function AccountDeletionSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Sign out the user from the client to clear local auth state
    const signOutUser = async () => {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch (signOutError) {
        // Continue anyway since account is deleted
        console.error("Error signing out user:", signOutError);
      }
    };

    signOutUser();

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-foreground">Konto slettet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Din {companyConfig.name}-konto er nå permanent slettet som forespurt.
              </p>

              <div className="bg-green-50 dark:bg-green-950/50 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Bekreftelse sendt
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      Du vil motta en bekreftelse via e-post med detaljer om
                      hvilke data som er slettet.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-2">
                <p>
                  <strong>Hva som ble slettet:</strong>
                </p>
                <ul className="text-left space-y-1 list-disc list-inside text-xs">
                  <li>Personlig profil og kontoinformasjon</li>
                  <li>Alle bestillinger og historikk</li>
                  <li>Meldinger og samtaler</li>
                  <li>Anmeldelser og vurderinger</li>
                  <li>Lagrede betalingsmetoder og adresser</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <p className="text-sm text-muted-foreground">
                Takk for at du valgte {companyConfig.name}. Vi håper du hadde en
                positiv opplevelse.
              </p>

              <div className="space-y-3">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm font-medium text-foreground">
                    Du omdirigeres til forsiden om {countdown} sekund
                    {countdown !== 1 ? "er" : ""}
                  </p>
                </div>

                <Button asChild className="w-full" variant="outline">
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    Gå til forsiden nå
                  </Link>
                </Button>

                <p className="text-xs text-muted-foreground">
                  Du kan når som helst opprette en ny konto hvis du ønsker å
                  komme tilbake i fremtiden.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
