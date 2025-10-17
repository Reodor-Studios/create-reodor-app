"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, List, ArrowDown } from "lucide-react";
import type { SetupStep } from "@/stores/setup-steps.store";

const categoryConfig = {
  initial: {
    title: "Getting Started",
    icon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4.5 16.5c-1.5 1.25-2 5-2 5s3.75-.5 5-2c.52-.52.98-1.08 1.38-1.65A1.82 1.82 0 0 0 9 17.5a1.82 1.82 0 0 0-.12-.88A1.82 1.82 0 0 0 8 16.5a1.82 1.82 0 0 0-.88-.12A1.82 1.82 0 0 0 6.5 16a1.82 1.82 0 0 0-.12-.88c-.57-.4-1.13-.86-1.65-1.38-1.5-1.25-2-5-2-5s3.75.5 5 2l.88.12A1.82 1.82 0 0 1 9 11.5a1.82 1.82 0 0 1 .12.88A1.82 1.82 0 0 1 9.5 13a1.82 1.82 0 0 1 .88.12c.4.57.86 1.13 1.38 1.65 1.5 1.25 2 5 2 5s-3.75-.5-5-2c-.52-.52-.98-1.08-1.38-1.65a1.82 1.82 0 0 0 .12-.88 1.82 1.82 0 0 0-.12-.88 1.82 1.82 0 0 0-.88-.12 1.82 1.82 0 0 0-.12-.88 1.82 1.82 0 0 0-.88-.12 1.82 1.82 0 0 0-.12-.88c-.57-.4-1.13-.86-1.65-1.38z" />
        <path d="m14 5 4 4" />
        <path d="m6 5 4 4" />
      </svg>
    ),
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  database: {
    title: "Database & Configuration",
    icon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
        <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
      </svg>
    ),
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  services: {
    title: "External Services",
    icon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  deployment: {
    title: "Deployment",
    icon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
  },
} as const;

interface TableOfContentsProps {
  getStepsByCategory: (category: SetupStep["category"]) => SetupStep[];
}

export function TableOfContents({ getStepsByCategory }: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const categories: SetupStep["category"][] = [
    "initial",
    "database",
    "services",
    "deployment",
  ];

  const scrollToSection = (category: SetupStep["category"]) => {
    const section = document.getElementById(`section-${category}`);
    if (section) {
      const yOffset = -80; // Negative offset to scroll less
      const y =
        section.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setIsOpen(false); // Close TOC after navigation
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-2">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <List className="w-5 h-5 text-blue-500" />
                Table of Contents
              </CardTitle>
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <ScrollArea className="max-h-[400px] pr-4">
              <div className="space-y-3">
                {categories.map((category) => {
                  const config = categoryConfig[category];
                  const Icon = config.icon;
                  const steps = getStepsByCategory(category);
                  const completedSteps = steps.filter(
                    (s) => s.completed
                  ).length;

                  return (
                    <button
                      key={category}
                      onClick={() => scrollToSection(category)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:shadow-md ${config.borderColor} ${config.bgColor} hover:scale-[1.02]`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-background shadow-sm">
                          <div className={config.color}>
                            <Icon />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-base">
                            {config.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {completedSteps} of {steps.length} completed
                          </p>
                        </div>
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
