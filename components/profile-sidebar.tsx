"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  DollarSign,
  BookOpen,
  Settings,
  Calendar,
  MessageCircle,
  Scissors,
  Star,
  Users,
} from "lucide-react";

interface ProfileSidebarProps {
  profileId: string;
  userRole?: string;
  className?: string;
}

const getSidebarItems = (userRole?: string) => {
  const baseItems = [
    {
      title: "Min side",
      href: "/profil",
      icon: User,
      description: "Rediger profilinformasjon",
    },
    {
      title: "Mine bookinger",
      href: "/mine-bookinger",
      icon: BookOpen,
      description: "Oversikt over bookinger",
    },
    {
      title: "Chat",
      href: "/chat",
      icon: MessageCircle,
      description: "Meldinger og samtaler",
    },
    {
      title: "Anmeldelser",
      href: "/anmeldelser",
      icon: Star,
      description: "Se og administrer anmeldelser",
    },
  ];

  // Add stylist-specific items
  if (userRole === "stylist") {
    baseItems.push({
      title: "Tilgjengelighet",
      href: "/tilgjengelighet",
      icon: Calendar,
      description: "Administrer kalender",
    });
    baseItems.push({
      title: "Mine tjenester",
      href: "/mine-tjenester",
      icon: Scissors,
      description: "Administrer dine tjenester",
    });
    baseItems.push({
      title: "Inntekter",
      href: "/inntekter",
      icon: DollarSign,
      description: "Inntekter og utbetalinger",
    });
    baseItems.push({
      title: "Partner",
      href: "/partner",
      icon: Users,
      description: "Partner-program",
    });
  }

  // Add common items at the end
  baseItems.push({
    title: "Preferanser",
    href: "/preferanser",
    icon: Settings,
    description: "Innstillinger og preferanser",
  });

  return baseItems;
};

export const ProfileSidebar = ({
  profileId,
  userRole,
  className,
}: ProfileSidebarProps) => {
  const pathname = usePathname();
  const sidebarItems = getSidebarItems(userRole);

  return (
    <aside className={cn("w-64 bg-background p-2", className)}>
      <div className="flex flex-col gap-4">
        <nav className="flex flex-col gap-2">
          {sidebarItems.map((item, index) => {
            const href = `/profiler/${profileId}${item.href}`;
            const isActive = pathname === href;
            const Icon = item.icon;

            return (
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-accent text-accent-foreground"
                )}
                key={index}
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

// Export the sidebar items function for use in mobile navigation
export { getSidebarItems };
