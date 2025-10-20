import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Marquee } from "@/components/ui/marquee";
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
        "group relative w-64 cursor-pointer overflow-hidden rounded-xl border p-4",
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
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 flex-shrink-0">
          <Image
            src={item.logo}
            alt={`${item.name} logo`}
            fill
            className="object-contain"
          />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm group-hover:text-primary transition-colors">
            {item.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {item.description}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function TechStackMarquee() {
  // Split tech stack into two rows for better visual balance
  const firstRow = TECH_STACK.slice(0, Math.ceil(TECH_STACK.length / 2));
  const secondRow = TECH_STACK.slice(Math.ceil(TECH_STACK.length / 2));

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

      {/* Marquee section with constrained width */}
      <div className="relative mt-12 max-w-6xl mx-auto overflow-hidden">
        <div className="flex flex-col items-center justify-center gap-4">
          {/* First row - scrolling right */}
          <Marquee pauseOnHover className="[--duration:60s]">
            {firstRow.map((item) => (
              <TechStackCard key={item.name} item={item} />
            ))}
          </Marquee>

          {/* Second row - scrolling left */}
          <Marquee reverse pauseOnHover className="[--duration:60s]">
            {secondRow.map((item) => (
              <TechStackCard key={item.name} item={item} />
            ))}
          </Marquee>
        </div>

        {/* Gradient overlays for smooth edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-background" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-background" />
      </div>
    </section>
  );
}
