import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{
    redirectTo?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { redirectTo } = await searchParams;
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Takk for at du registrerte deg!
              </CardTitle>
              <CardDescription>
                Sjekk e-posten din for å bekrefte kontoen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Vi har sendt en bekreftelseslenke til din e-post.
                </p>
                <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                  Klikk på lenken i e-posten for å fullføre registreringen.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Har du ikke mottatt e-posten? Sjekk spam-mappen din eller prøv
                  å registrere deg på nytt.
                </p>

                <div className="flex flex-col gap-2 pt-2">
                  <Button variant="outline" asChild className="w-full">
                    <Link
                      href={`/auth/sign-up${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`}
                    >
                      Registrer deg på nytt
                    </Link>
                  </Button>

                  <Button variant="ghost" asChild className="w-full" size="sm">
                    <Link
                      href={`/auth/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`}
                    >
                      Har du allerede en konto? Logg inn
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
