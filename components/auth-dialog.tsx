"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { AuthForm } from "@/components/auth";
import type { AuthMode } from "@/components/auth";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectTo?: string;
  initialMode?: AuthMode;
  labels?: {
    loginTitle?: string;
    signupTitle?: string;
    loginDescription?: string;
    signupDescription?: string;
    loginButton?: string;
    signupButton?: string;
    loginLoadingButton?: string;
    signupLoadingButton?: string;
    switchToSignup?: string;
    switchToLogin?: string;
  };
}

export function AuthDialog({
  open,
  onOpenChange,
  redirectTo,
  initialMode = "login",
  labels = {},
}: AuthDialogProps) {
  const [currentMode, setCurrentMode] = useState<AuthMode>(initialMode);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const defaultLabels = {
    loginTitle: "Logg inn",
    signupTitle: "Registrer deg",
    loginDescription: "Skriv inn din e-post for å logge inn",
    signupDescription: "Opprett en ny konto",
  };

  const finalLabels = { ...defaultLabels, ...labels };

  const handleClose = (open: boolean) => {
    if (!open) {
      setCurrentMode(initialMode);
    }
    onOpenChange(open);
  };

  const renderContent = () => (
    <AuthForm
      initialMode={currentMode}
      redirectTo={redirectTo}
      labels={labels}
      onModeChange={(newMode) => setCurrentMode(newMode)}
      onSuccess={() => {
        // Close dialog/drawer after showing success state
        setTimeout(() => {
          onOpenChange(false);
        }, 2000);
      }}
    />
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentMode === "login"
                ? finalLabels.loginTitle
                : finalLabels.signupTitle}
            </DialogTitle>
            <DialogDescription>
              {currentMode === "login"
                ? finalLabels.loginDescription
                : finalLabels.signupDescription}
            </DialogDescription>
          </DialogHeader>
          {renderContent()}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="h-[100dvh] max-h-[100dvh]">
        <DrawerHeader className="flex-shrink-0">
          <DrawerTitle>
            {currentMode === "login"
              ? finalLabels.loginTitle
              : finalLabels.signupTitle}
          </DrawerTitle>
          <DrawerDescription>
            {currentMode === "login"
              ? finalLabels.loginDescription
              : finalLabels.signupDescription}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 min-h-0 px-4 pb-4 overflow-y-auto">
          {renderContent()}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
