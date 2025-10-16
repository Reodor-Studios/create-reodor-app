"use client";

import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { isAdmin } from "@/lib/permissions";
import { companyConfig } from "@/lib/brand";
import { navigationItems } from "@/lib/navigation";

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { profile, loading } = useAuth();

  // Build company links from navigationItems plus standard company pages
  const companyLinks = [
    ...navigationItems
      .filter((item) => item.href) // Only include items with href
      .map((item) => ({ name: item.title, href: item.href! })),
    { name: "Om oss", href: "/om-oss" },
    { name: "Kontakt", href: "/kontakt" },
  ];

  // Add admin link if user is admin and not loading
  if (!loading && profile && isAdmin(profile.role)) {
    companyLinks.push({ name: "Administrator", href: "/admin" });
  }

  const legalLinks = [
    { name: "Personvern", href: "/privacy" },
    { name: "Vilkår", href: "/terms-of-service" },
    { name: "Ofte stilte spørsmål (FAQ)", href: "/faq" },
  ];

  return (
    <footer className="bg-background border-t">
      <div className="w-full max-w-none mx-auto px-6 lg:px-12 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center mb-4">
              <h1 className="font-bold text-xl text-primary">{companyConfig.name}</h1>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              {companyConfig.tagline}
            </p>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-fraunces font-semibold mb-4">Selskap</h3>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-fraunces font-semibold mb-4">Juridisk</h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} {companyConfig.name}. Alle rettigheter reservert.
          </p>
        </div>
      </div>
    </footer>
  );
};
