"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";

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
