"use client";

import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { ArrowDown, Github } from "lucide-react";
import Prism from "@/components/Prism";
import { companyConfig } from "@/lib/brand";
import { SetupProject } from "@/components/setup-project";
import { InstallCommand } from "@/components/install-command";
import { TechStackMarquee } from "@/components/tech-stack-marquee";
import {
  Announcement,
  AnnouncementTag,
  AnnouncementTitle,
} from "@/components/kibo-ui/announcement";

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

        <div className="relative z-10 text-center space-y-8 px-6 max-w-7xl mx-auto">
          <BlurFade delay={0} duration={0.5} inView>
            <div className="space-y-6">
              <div className="flex justify-center">
                <Announcement className="text-xs sm:text-sm backdrop-blur-md bg-background/60 border-border/50 shadow-lg hover:shadow-xl hover:border-primary/50 transition-all duration-300">
                  <AnnouncementTag>Introducing</AnnouncementTag>
                  <AnnouncementTitle className="font-mono">
                    create-reodor-app
                  </AnnouncementTitle>
                </Announcement>
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-foreground leading-tight max-w-5xl mx-auto hyphens-auto px-4">
                A starter template specialized for agentic coding
              </h1>
              <p className="text-sm sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                Maximize developer velocity with AI-powered workflows and safe
                guardrails
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
            <InstallCommand className="max-w-2xl mx-auto mt-8 text-xs sm:text-sm" />
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
