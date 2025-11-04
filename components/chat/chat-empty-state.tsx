"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BlurFade } from "@/components/ui/blur-fade";
import { CATEGORIES, type Category } from "@/types/chat";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ChatEmptyStateProps {
  onQuestionSelect: (question: string) => void;
}

export function ChatEmptyState({ onQuestionSelect }: ChatEmptyStateProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <BlurFade delay={0.1} duration={0.5} inView>
        <h1 className="text-4xl font-bold text-center mb-2">
          How can I help you?
        </h1>
        <p className="text-muted-foreground text-center mb-12">
          Choose a category or type your question below
        </p>
      </BlurFade>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
        {CATEGORIES.map((category, categoryIndex) => (
          <BlurFade
            key={category.id}
            delay={0.2 + categoryIndex * 0.1}
            duration={0.5}
            inView
          >
            <CategoryCard
              category={category}
              isSelected={selectedCategory === category.id}
              onClick={() => handleCategoryClick(category.id)}
              onQuestionSelect={onQuestionSelect}
            />
          </BlurFade>
        ))}
      </div>
    </div>
  );
}

interface CategoryCardProps {
  category: Category;
  isSelected: boolean;
  onClick: () => void;
  onQuestionSelect: (question: string) => void;
}

function CategoryCard({
  category,
  isSelected,
  onClick,
  onQuestionSelect,
}: CategoryCardProps) {
  const Icon = category.icon;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md border-2",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50",
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <div
            className={cn(
              "p-2 rounded-lg",
              isSelected ? "bg-primary text-primary-foreground" : "bg-muted",
            )}
          >
            <Icon className="size-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{category.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {category.description}
            </p>
          </div>
        </div>

        {isSelected && (
          <div className="space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
            {category.questions.map((question, index) => (
              <BlurFade
                key={index}
                delay={index * 0.05}
                duration={0.3}
                inView
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuestionSelect(question);
                  }}
                  className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                >
                  {question}
                </button>
              </BlurFade>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
