import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MapPin, Clock, MessageSquare } from "lucide-react";
import Link from "next/link";
import { companyConfig } from "@/lib/brand";
import { ContactForm } from "@/components/contact-form";

const KontaktPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="md:container mx-auto px-6 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Kontakt oss
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Har du spørsmål eller trenger hjelp? Vi er her for deg! Send oss
              en melding og vi svarer så fort som mulig.
            </p>
          </div>
        </div>
      </div>

      <div className="md:container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Send oss en melding</CardTitle>
              <CardDescription>
                Fyll ut skjemaet nedenfor og vi tar kontakt med deg så snart
                som mulig.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col h-[675px]">
              <ContactForm />
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-6">
                Kontaktinformasjon
              </h2>
              <p className="text-muted-foreground mb-8">
                Du kan også nå oss direkte via e-post eller telefon. Vi svarer
                vanligvis innen {companyConfig.responseTime} på hverdager.
              </p>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">E-post</h3>
                      <Link
                        href={`mailto:${companyConfig.supportEmail}`}
                        className="text-muted-foreground hover:text-secondary"
                      >
                        {companyConfig.supportEmail}
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1">
                        Svarer vanligvis innen {companyConfig.responseTime}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Telefon</h3>
                      <p className="text-muted-foreground">
                        {companyConfig.supportPhone}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {companyConfig.hours.phoneHours}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Adresse</h3>
                      <p className="text-muted-foreground">
                        {companyConfig.address.company}
                        <br />
                        {companyConfig.address.street}
                        <br />
                        {companyConfig.address.postalCode}{" "}
                        {companyConfig.address.city},{" "}
                        {companyConfig.address.country}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Åpningstider</h3>
                      <div className="text-muted-foreground space-y-1">
                        <p>
                          Mandag - Fredag: {companyConfig.hours.weekdays}
                        </p>
                        <p>Lørdag: {companyConfig.hours.saturday}</p>
                        <p>Søndag: {companyConfig.hours.sunday}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <Separator className="my-12" />

        {/* FAQ Section Placeholder */}
        <div className="max-w-4xl mx-auto">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageSquare />
              </EmptyMedia>
              <EmptyTitle>FAQ Section</EmptyTitle>
              <EmptyDescription>
                Developers can add frequently asked questions specific to their
                business here
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <p className="text-muted-foreground">
                This section can be customized with domain-specific FAQs or
                removed entirely if not needed.
              </p>
            </EmptyContent>
          </Empty>
        </div>
      </div>
    </div>
  );
};

export default KontaktPage;
