"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";

import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { TECH_STACK } from "@/lib/tech-stack";
import type { TechStackItem } from "@/lib/tech-stack";

interface TechStackCardProps {
  item: TechStackItem;
}

function TechStackCard({ item }: TechStackCardProps) {
  return (
    <Link
      href={item.website}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative flex w-64 h-[88px] cursor-pointer overflow-hidden rounded-xl border p-4",
        "transition-all duration-300 ease-out",
        "hover:scale-105 hover:shadow-lg hover:z-10",
        // Light mode
        "border-gray-950/[.1] bg-gray-950/[.01]",
        "hover:bg-primary/5 hover:border-primary/20",
        // Dark mode
        "dark:border-gray-50/[.1] dark:bg-gray-50/[.150]",
        "dark:hover:bg-primary/10 dark:hover:border-primary/30"
      )}
    >
      <div className="flex items-center gap-3 w-full">
        <div className="relative h-10 w-10 flex-shrink-0">
          <Image
            src={item.logo}
            alt={`${item.name} logo`}
            fill
            className="object-contain"
          />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-semibold text-sm group-hover:text-primary transition-colors">
            {item.name}
          </span>
          <span className="text-xs text-muted-foreground line-clamp-2">
            {item.description}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function TechStackCarousel() {
  // Use autoplay plugin with ref
  const plugin = React.useRef(
    Autoplay({ delay: 3000, playOnInit: true, stopOnInteraction: false })
  );

  return (
    <section className="pt-20 px-6 lg:px-12 pb-20">
      {/* Title section with constrained width */}
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Powered by a Modern Tech Stack
          </h2>
          <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Built with the best tools and frameworks to ensure performance,
            scalability, and developer experience.
          </p>
        </div>
      </div>

      {/* Carousel section */}
      <div className="relative mt-12 max-w-6xl mx-auto">
        <div className="py-4">
          <Carousel
            opts={{
              align: "start",
              loop: true,
              dragFree: true,
              watchDrag: true,
            }}
            plugins={[plugin.current]}
            className="w-full cursor-grab active:cursor-grabbing"
          >
            <CarouselContent className="-ml-4">
              {TECH_STACK.map((item, index) => (
                <CarouselItem
                  key={`${item.name}-${index}`}
                  className="pl-4 basis-auto py-1"
                >
                  <TechStackCard item={item} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Gradient overlays for smooth edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background" />
      </div>
    </section>
  );
}
