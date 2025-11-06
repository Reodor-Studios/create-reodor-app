"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Conversation } from "@/lib/chat";
import { formatRelativeTime } from "@/lib/chat";
import { PinIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ChatHistoryCardProps {
  conversation: Conversation;
}

export function ChatHistoryCard({ conversation }: ChatHistoryCardProps) {
  const charLimit = 60;
  const previewLimit = 80;

  const displayTitle =
    conversation.title.length > charLimit
      ? conversation.title.slice(0, charLimit) + "..."
      : conversation.title;

  const displayPreview = conversation.preview
    ? conversation.preview.length > previewLimit
      ? conversation.preview.slice(0, previewLimit) + "..."
      : conversation.preview
    : "No messages yet";

  const relativeTime = formatRelativeTime(conversation.updated_at);

  return (
    <Link href={`/chat/${conversation.id}`}>
      <Card
        className={cn(
          "h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer",
          "border-border bg-card dark:bg-card"
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm line-clamp-2 flex-1">
              {displayTitle}
            </h3>
            {conversation.pinned && (
              <PinIcon className="size-3 shrink-0 text-primary mt-0.5" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {displayPreview}
          </p>
          <p className="text-xs text-muted-foreground">
            Last message {relativeTime}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
