"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { AuthDialog } from "@/components/auth-dialog";
import { UserDropdown } from "@/components/nav/user-dropdown";
import { navigationItems } from "@/lib/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  Menu,
  LogOut,
  ShoppingCart,
  MessageCircle,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSidebarItems } from "./profile-sidebar";
import { adminSidebarItems } from "./admin-sidebar";
import { isAdmin } from "@/lib/permissions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCurrentUserImage } from "@/hooks/use-current-user-image";
import { cn } from "@/lib/utils";
import { AnimatedThemeToggler } from "./ui/animated-theme-toggler";
import { Spinner } from "./ui/spinner";
import { companyConfig } from "@/lib/brand";

export const Navbar = () => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const avatarQuery = useCurrentUserImage();
  const avatarImage = avatarQuery.data;
  const isAvatarLoading = avatarQuery.isLoading;

  const initials =
    profile?.full_name
      ?.split(" ")
      ?.filter((_, index, array) => index === 0 || index === array.length - 1)
      ?.map((word) => word[0])
      ?.join("")
      ?.toUpperCase() || user?.email?.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    setSheetOpen(false);
  };

  const handleLoginClick = () => {
    setAuthMode("login");
    setShowAuthDialog(true);
    setSheetOpen(false);
  };

  const handleLinkClick = () => {
    setSheetOpen(false);
  };

  return (
    <header className="w-full z-40 fixed top-0 left-0 bg-background border-b">
      <div className="w-full max-w-none mx-auto px-4 sm:px-6 lg:px-12 min-h-16 flex items-center justify-between">
        {/* Logo and Navigation - Always consistent structure */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
            <h1 className="font-bold text-xl lg:text-xl text-primary">
              {companyConfig.name}
            </h1>
          </Link>

          {/* Desktop Navigation - Hidden on mobile */}
          <Separator orientation="vertical" className="h-6 hidden lg:block" />
          <div className="hidden lg:flex items-center">
            {navigationItems
              .filter((item) => {
                // Only show /oppgaver if user is authenticated
                if (item.href === "/oppgaver") {
                  return !!user;
                }
                return true;
              })
              .map((item) => (
                <Button key={item.title} variant="ghost" size="sm" asChild>
                  <Link href={item.href!}>{item.title}</Link>
                </Button>
              ))}
          </div>
        </div>

        {/* Right Side Actions - Always consistent */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Mobile-only: Login Button for unauthenticated users */}
          {!loading && !user && (
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={handleLoginClick}
            >
              Logg inn
            </Button>
          )}

          {/* Desktop-only: Theme switcher and separator */}
          <Separator orientation="vertical" className="h-6 hidden lg:block" />
          <div className="hidden lg:block">
            <AnimatedThemeToggler />
          </div>

          {/* Auth Section */}
          {loading && <Spinner className="w-4 h-4" />}

          {!loading && (
            <>
              {user && profile ? (
                <UserDropdown
                  user={user}
                  profile={profile}
                  onSignOut={handleSignOut}
                />
              ) : (
                <>
                  {/* Desktop Auth Buttons */}
                  <div className="hidden lg:flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLoginClick}
                    >
                      Logg inn
                    </Button>
                  </div>
                </>
              )}
            </>
          )}

          {/* Mobile Menu Sheet - Always present */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden relative"
              >
                <Menu className="w-4 h-4" />
                <span className="sr-only">Åpne meny</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 sm:w-96">
              <SheetHeader className="text-left px-4">
                <div className="flex items-center justify-start gap-2">
                  <SheetTitle className="text-primary font-bold font-fraunces text-xl">
                    {companyConfig.name}
                  </SheetTitle>
                  <AnimatedThemeToggler />
                </div>
              </SheetHeader>

              <div className="flex flex-col h-full pt-6 px-4 overflow-y-auto">
                {/* Auth Buttons for Unauthenticated Users - Above Navigation */}
                {!loading && !user && (
                  <div className="space-y-2 mb-6">
                    <Button
                      variant="outline"
                      onClick={handleLoginClick}
                      className="w-full"
                    >
                      Logg inn
                    </Button>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Navigation Links */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                      Navigasjon
                    </h3>
                    {navigationItems
                      .filter((item) => {
                        // Only show /oppgaver if user is authenticated
                        if (item.href === "/oppgaver") {
                          return !!user;
                        }
                        return true;
                      })
                      .map((item) => (
                        <Button
                          key={item.title}
                          variant="ghost"
                          className="w-full justify-start text-base"
                          asChild
                        >
                          <Link href={item.href!} onClick={handleLinkClick}>
                            <ChevronRight className="w-4 h-4" /> {item.title}
                          </Link>
                        </Button>
                      ))}
                  </div>

                  {/* User Profile Links */}
                  {user && (
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        Min profil
                      </h3>
                      {getSidebarItems(profile?.role).map((item) => {
                        const Icon = item.icon;
                        return (
                          <Button
                            key={item.href}
                            variant="ghost"
                            className="w-full justify-start text-base"
                            asChild
                          >
                            <Link
                              href={`/profiler/${user.id}${item.href}`}
                              onClick={handleLinkClick}
                              className="flex items-center gap-2"
                            >
                              <Icon className="w-4 h-4" />
                              {item.title}
                            </Link>
                          </Button>
                        );
                      })}
                    </div>
                  )}

                  {/* Admin Links */}
                  {user && profile && isAdmin(profile.role) && (
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        Admin
                      </h3>
                      {adminSidebarItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Button
                            key={item.href}
                            variant="ghost"
                            className="w-full justify-start text-base"
                            asChild
                          >
                            <Link
                              href={item.href}
                              onClick={handleLinkClick}
                              className="flex items-center gap-2"
                            >
                              <Icon className="w-4 h-4" />
                              {item.title}
                            </Link>
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Auth Actions at Bottom - Only for authenticated users */}
                {!loading && user && (
                  <div className="mt-auto pt-6 pb-6 border-t space-y-4">
                    <div className="flex items-center gap-3 px-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto"
                        asChild
                      >
                        <Link
                          href={`/profiler/${user.id}`}
                          onClick={handleLinkClick}
                        >
                          <Avatar className="h-10 w-10">
                            {!isAvatarLoading && avatarImage && (
                              <AvatarImage src={avatarImage} alt={initials} />
                            )}
                            <AvatarFallback>
                              {isAvatarLoading ? (
                                <Spinner className="h-4 w-4" />
                              ) : (
                                initials
                              )}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                      </Button>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {profile?.full_name || user.email?.split("@")[0]}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={handleSignOut}
                      className="w-full justify-start text-base"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logg ut
                    </Button>
                  </div>
                )}

                {loading && (
                  <div className="mt-auto flex justify-center py-4">
                    <Spinner className="w-4 h-4" />
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        initialMode={authMode}
      />
    </header>
  );
};
