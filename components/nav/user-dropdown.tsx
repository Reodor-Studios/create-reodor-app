"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CurrentUserAvatar } from "@/components/current-user-avatar";
import { getSidebarItems } from "@/components/profile-sidebar";
import { adminSidebarItems } from "@/components/admin-sidebar";
import { isAdmin } from "@/lib/permissions";
import { LogOut, MessageSquare } from "lucide-react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { DatabaseTables } from "@/types";

interface UserDropdownProps {
  user: User;
  profile: DatabaseTables["profiles"]["Row"];
  onSignOut: () => void;
}

export function UserDropdown({ user, profile, onSignOut }: UserDropdownProps) {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <CurrentUserAvatar />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {getSidebarItems(profile?.role).map((item) => {
            const Icon = item.icon;
            return (
              <DropdownMenuItem key={item.href} asChild>
                <Link
                  href={`/profiler/${user.id}${item.href}`}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {item.title}
                </Link>
              </DropdownMenuItem>
            );
          })}
          {profile && isAdmin(profile.role) && (
            <>
              <DropdownMenuSeparator />
              {adminSidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {item.title}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </>
          )}
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5">
            <p className="font-semibold text-xs">
              {profile?.full_name || user.email?.split("@")[0]}
            </p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onSignOut}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logg ut
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
