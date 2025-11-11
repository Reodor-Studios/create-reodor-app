import { BlurFade } from "@/components/ui/blur-fade";
import { Skeleton } from "@/components/ui/skeleton";

export function ChatLoadingSkeleton() {
  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-4 md:px-6 py-4 space-y-0">
      {/* Assistant message (left-aligned) */}
      <BlurFade delay={0.1} duration={0.5} inView>
        <div className="flex flex-row-reverse justify-end items-end gap-2 py-4 w-full">
          <Skeleton className="size-8 rounded-full flex-shrink-0" />
          <div className="flex flex-col gap-2 max-w-[80%]">
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </div>
      </BlurFade>

      {/* User message (right-aligned) */}
      <BlurFade delay={0.2} duration={0.5} inView>
        <div className="flex items-end justify-end gap-2 py-4 w-full">
          <div className="flex flex-col gap-2 max-w-[80%]">
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
          <Skeleton className="size-8 rounded-full flex-shrink-0" />
        </div>
      </BlurFade>

      {/* Assistant message (left-aligned) */}
      <BlurFade delay={0.3} duration={0.5} inView>
        <div className="flex flex-row-reverse justify-end items-end gap-2 py-4 w-full">
          <Skeleton className="size-8 rounded-full flex-shrink-0" />
          <div className="flex flex-col gap-2 max-w-[80%]">
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>
      </BlurFade>

      {/* User message (right-aligned) */}
      <BlurFade delay={0.4} duration={0.5} inView>
        <div className="flex items-end justify-end gap-2 py-4 w-full">
          <div className="flex flex-col gap-2 max-w-[60%]">
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <Skeleton className="size-8 rounded-full flex-shrink-0" />
        </div>
      </BlurFade>
    </div>
  );
}
