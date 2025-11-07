"use client";

import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";
import { useEffect, useState } from "react";

export type LoaderProps = HTMLAttributes<HTMLDivElement>;

export const Loader = ({ className, ...props }: LoaderProps) => {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === ".") return "..";
        if (prev === "..") return "...";
        return ".";
      });
    }, 500); // Change dots every 500ms

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    >
      Agent is thinking{dots}
    </div>
  );
};
