"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Scissors,
  CreditCard,
  Percent,
  Wrench,
  Users,
  Map,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface AdminSidebarProps {
  className?: string;
}

const adminSidebarItems = [
  {
    title: "Oversikt",
    href: "/admin",
    icon: LayoutDashboard,
    description: "Dashboard og statistikk",
  },
  {
    title: "Søknader",
    href: "/admin/soknader",
    icon: FileText,
    description: "Håndter stylist-søknader",
  },
  {
    title: "Tjenestekategorier",
    href: "/admin/tjenester",
    icon: Scissors,
    description: "Administrer kategorier",
  },
  {
    title: "Tilbakemeldinger",
    href: "/admin/tilbakemeldinger",
    icon: MessageSquare,
    description: "Administrer brukertilbakemeldinger",
  },
  {
    title: "Betalinger",
    href: "/admin/betalinger",
    icon: CreditCard,
    description: "Administrer betalinger og refusjon",
  },
  {
    title: "Rabattkoder",
    href: "/admin/rabattkoder",
    icon: Percent,
    description: "Administrer rabattkoder og kampanjer",
  },
  {
    title: "Partner",
    href: "/admin/partner",
    icon: Users,
    description: "Administrer partner-program",
  },
  {
    title: "Kart",
    href: "/admin/kart",
    icon: Map,
    description: "Geografisk oversikt over brukere",
  },
];

const devToolsItems = [
  {
    title: "Utvikler-verktøy",
    href: "/admin/dev-tools",
    icon: Wrench,
    description: "Testing av betalingsflyt og cron jobs",
  },
];

export const AdminSidebar = ({ className }: AdminSidebarProps) => {
  const pathname = usePathname();

  return (
    <aside className={cn("w-64 bg-background p-2", className)}>
      <div className="flex flex-col gap-4">
        <nav className="flex flex-col gap-2">
          {adminSidebarItems.map((item, index) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-accent text-accent-foreground"
                )}
                key={item.href}
              >
                <Icon className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

// Export the sidebar items for use in mobile navigation
export { adminSidebarItems };
