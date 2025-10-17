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
import {
  ChevronDown,
  List,
  ArrowDown,
  Rocket,
  Database,
  Settings,
  Star,
} from "lucide-react";
import type { SetupStep } from "@/stores/setup-steps.store";

const categoryConfig = {
  initial: {
    title: "Getting Started",
    icon: () => <Rocket className="w-4 h-4" />,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  database: {
    title: "Database & Configuration",
    icon: () => <Database className="w-4 h-4" />,
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  services: {
    title: "External Services",
    icon: () => <Settings className="w-4 h-4" />,
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  deployment: {
    title: "Deployment",
    icon: () => <Star className="w-4 h-4" />,
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
              <div className="space-y-3 flex flex-col justify-center items-center p-4">
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
