"use client";

import { useState, useRef } from "react";
import { motion } from "motion/react";
import { CopyIcon } from "@/components/ui/copy";
import type { CopyIconHandle } from "@/components/ui/copy";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { companyConfig } from "@/lib/brand";
import { toast } from "sonner";

interface InstallCommandProps {
  className?: string;
}

export function InstallCommand({ className }: InstallCommandProps) {
  const [isCopied, setIsCopied] = useState(false);
  const copyIconRef = useRef<CopyIconHandle>(null);

  // Extract owner/repo from GitHub URL
  const githubPath = companyConfig.githubUrl.replace("https://github.com/", "");
  const command = `npx gitpick ${githubPath} my-app`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setIsCopied(true);
      copyIconRef.current?.startAnimation();
      toast.success("Copied to clipboard!");

      setTimeout(() => {
        setIsCopied(false);
        copyIconRef.current?.stopAnimation();
      }, 2000);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <motion.div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/50 backdrop-blur-md bg-background/30 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/50",
        className
      )}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        initial={false}
      />

      <div className="relative flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
            Quick Start
          </p>
          <motion.code
            className="block font-mono text-sm sm:text-base text-foreground break-all"
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {command}
          </motion.code>
        </div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Button
            onClick={handleCopy}
            variant="outline"
            size="icon"
            className={cn(
              "shrink-0 transition-all duration-200",
              isCopied &&
                "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
            )}
            aria-label="Copy command to clipboard"
          >
            <CopyIcon ref={copyIconRef} size={18} />
          </Button>
        </motion.div>
      </div>

      {/* Bottom highlight bar */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100"
        initial={false}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}
