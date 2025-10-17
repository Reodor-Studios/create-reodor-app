"use client";

import { BlurFade } from "@/components/ui/blur-fade";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useSetupStepsStore, SetupStep } from "@/stores/setup-steps.store";
import {
  CheckCircle2,
  Circle,
  Database,
  Rocket,
  Settings,
  Sparkles,
  RotateCcw,
  ArrowDown,
  Github as GithubIcon,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Prism from "@/components/Prism";
import { companyConfig } from "@/lib/brand";
import { InlineCode } from "@/components/ui/inline-code";

const categoryConfig = {
  initial: {
    title: "Getting Started",
    icon: Rocket,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  database: {
    title: "Database & Configuration",
    icon: Database,
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  services: {
    title: "External Services",
    icon: Settings,
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  deployment: {
    title: "Deployment",
    icon: Sparkles,
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
  },
} as const;

function StepCard({ step, delay }: { step: SetupStep; delay: number }) {
  const { toggleStep } = useSetupStepsStore();

  return (
    <BlurFade delay={delay} duration={0.4} inView>
      <Card className="transition-all hover:shadow-md">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="pt-1">
              <Checkbox
                id={step.id}
                checked={step.completed}
                onCheckedChange={() => toggleStep(step.id)}
                className="h-5 w-5"
              />
            </div>
            <div className="flex-1 space-y-2">
              <label
                htmlFor={step.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <h3
                  className={`font-semibold text-lg transition-all ${
                    step.completed
                      ? "line-through text-muted-foreground"
                      : "text-foreground"
                  }`}
                >
                  {step.title}
                </h3>
                {step.completed && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
              </label>
              <p
                className={`text-sm leading-relaxed transition-all ${
                  step.completed
                    ? "text-muted-foreground/70"
                    : "text-muted-foreground"
                }`}
              >
                {step.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </BlurFade>
  );
}

function CategorySection({
  category,
  steps,
  baseDelay,
}: {
  category: SetupStep["category"];
  steps: SetupStep[];
  baseDelay: number;
}) {
  const config = categoryConfig[category];
  const Icon = config.icon;

  return (
    <div className="space-y-4">
      <BlurFade delay={baseDelay} duration={0.4} inView>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.bgColor}`}>
            <Icon className={`w-6 h-6 ${config.color}`} />
          </div>
          <h2 className="text-2xl font-bold">{config.title}</h2>
          <Badge variant="secondary" className="ml-auto">
            {steps.filter((s) => s.completed).length} / {steps.length}
          </Badge>
        </div>
      </BlurFade>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <StepCard
            key={step.id}
            step={step}
            delay={baseDelay + 0.05 + index * 0.05}
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const {
    steps,
    resetSteps,
    getCompletedCount,
    getTotalCount,
    getProgressPercentage,
    getStepsByCategory,
  } = useSetupStepsStore();

  const completedCount = getCompletedCount();
  const totalCount = getTotalCount();
  const progressPercentage = getProgressPercentage();

  const scrollToSteps = () => {
    const stepsSection = document.getElementById("setup-steps");
    if (stepsSection) {
      stepsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main className="min-h-screen">
      {/* Hero Section with Prism */}
      <section className="relative w-full h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Prism
            animationType="rotate"
            timeScale={0.15}
            height={3.5}
            baseWidth={5.5}
            scale={3.6}
            hueShift={0}
            colorFrequency={1}
            noise={0}
            glow={0.7}
          />
        </div>

        <div className="absolute inset-0 backdrop-blur-sm bg-black/10" />

        <div className="relative z-10 text-center space-y-8 px-6 max-w-4xl mx-auto">
          <BlurFade delay={0} duration={0.5} inView>
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground font-mono">
                create-reodor-app
              </h1>
              <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto">
                A comprehensive Next.js starter template with Supabase and
                modern tooling
              </p>
            </div>
          </BlurFade>

          <BlurFade delay={0.2} duration={0.5} inView>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={scrollToSteps}
                className="min-w-[160px]"
              >
                Get Started
                <ArrowDown className="ml-2 w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="min-w-[160px]"
              >
                <a
                  href={companyConfig.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GithubIcon className="mr-2 w-4 h-4" />
                  View on GitHub
                </a>
              </Button>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Setup Steps Section */}
      <section id="setup-steps" className="pt-20 px-6 lg:px-12 pb-20">
        <div className="max-w-5xl mx-auto space-y-12">
          <BlurFade delay={0} duration={0.5} inView>
            <div className="text-center space-y-4">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Setup Your Project
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Follow the steps below to get your project up and running.
              </p>
            </div>
          </BlurFade>

          {/* Zustand Demo Disclaimer */}
          <BlurFade delay={0.05} duration={0.5} inView>
            <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <p className="font-semibold mb-2">
                  This page demonstrates Zustand state management with localStorage persistence
                </p>
                <p className="text-sm">
                  Your progress is automatically saved and persists across browser sessions.
                  Check out the implementation in{" "}
                  <InlineCode>stores/setup-steps.store.ts</InlineCode> and{" "}
                  <InlineCode>app/page.tsx</InlineCode> to see how it works.
                  Try refreshing the page or closing and reopening your browser - your checked items will remain!
                </p>
              </AlertDescription>
            </Alert>
          </BlurFade>

          {/* Progress Section */}
          <BlurFade delay={0.1} duration={0.5} inView>
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Circle className="w-5 h-5 text-blue-500" />
                    Setup Progress
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetSteps}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {completedCount} of {totalCount} steps completed
                    </span>
                    <span className="text-muted-foreground">
                      {progressPercentage}%
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                </div>

                {progressPercentage === 100 && (
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Congratulations! You've completed all setup steps. Your
                      project is ready to go!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </BlurFade>

          {/* Setup Steps by Category */}
          <div className="space-y-12">
            <CategorySection
              category="initial"
              steps={getStepsByCategory("initial")}
              baseDelay={0.2}
            />

            <CategorySection
              category="database"
              steps={getStepsByCategory("database")}
              baseDelay={0.3}
            />

            <CategorySection
              category="services"
              steps={getStepsByCategory("services")}
              baseDelay={0.4}
            />

            <CategorySection
              category="deployment"
              steps={getStepsByCategory("deployment")}
              baseDelay={0.5}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
