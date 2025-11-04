"use client";

import { Button } from "@/components/ui/button";
import { BlurFade } from "@/components/ui/blur-fade";
import { CATEGORIES } from "@/types/chat";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ChatEmptyStateProps {
  onQuestionSelect: (question: string) => void;
}

export function ChatEmptyState({ onQuestionSelect }: ChatEmptyStateProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(
    CATEGORIES[0].id,
  );

  const selectedCategoryData = CATEGORIES.find(
    (cat) => cat.id === selectedCategory,
  );

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 w-full">
      <BlurFade delay={0.1} duration={0.5} inView>
        <h1 className="text-4xl font-bold text-center mb-2">
          How can I help you?
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          Choose a category to see suggested prompts
        </p>
      </BlurFade>

      {/* Horizontal Category Buttons */}
      <BlurFade delay={0.2} duration={0.5} inView>
        <div className="flex items-center gap-2 mb-8 p-1 bg-muted rounded-lg">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;

            return (
              <Button
                key={category.id}
                variant={isSelected ? "default" : "ghost"}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "flex items-center gap-2 transition-all",
                  isSelected && "shadow-sm",
                )}
              >
                <Icon className="size-4" />
                <span>{category.name}</span>
              </Button>
            );
          })}
        </div>
      </BlurFade>

      {/* Questions List */}
      {selectedCategoryData && (
        <div className="w-full flex flex-col gap-3">
          {selectedCategoryData.questions.map((question, index) => (
            <BlurFade
              key={index}
              delay={0.3 + index * 0.05}
              duration={0.4}
              inView
            >
              <button
                onClick={() => onQuestionSelect(question)}
                className="w-full text-left px-4 py-3 rounded-lg border border-border hover:border-primary hover:bg-accent transition-all text-sm"
              >
                {question}
              </button>
            </BlurFade>
          ))}
        </div>
      )}
    </div>
  );
}
