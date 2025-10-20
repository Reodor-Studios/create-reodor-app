"use client";

import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { Github } from "lucide-react";
import Prism from "@/components/Prism";
import { companyConfig } from "@/lib/brand";
import { SetupProject } from "@/components/setup-project";
import { InstallCommand } from "@/components/install-command";
import { TechStackMarquee } from "@/components/tech-stack-marquee";

export default function Home() {
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
                  <Github className="mr-2 w-4 h-4" />
                  View on GitHub
                </a>
              </Button>
            </div>
          </BlurFade>

          <BlurFade delay={0.4} duration={0.5} inView>
            <InstallCommand className="max-w-2xl mx-auto mt-8" />
          </BlurFade>
        </div>
      </section>

      {/* Tech Stack Marquee */}
      <TechStackMarquee />

      {/* Setup Project Section */}
      <SetupProject />
    </main>
  );
}
