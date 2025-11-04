"use client";

import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  groupConversationsByRecency,
  searchConversations,
  MOCK_CONVERSATIONS,
} from "@/types/chat";
import { MessageSquareIcon, PinIcon } from "lucide-react";

interface ConversationSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
}

export function ConversationSearchDialog({
  open,
  onOpenChange,
  currentConversationId,
  onSelectConversation,
}: ConversationSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  // Filter conversations based on search
  const filteredConversations = searchConversations(
    MOCK_CONVERSATIONS,
    searchQuery
  );

  // Group by recency
  const conversationGroups = groupConversationsByRecency(filteredConversations);

  const handleSelect = (conversationId: string) => {
    onSelectConversation(conversationId);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search conversations..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>No conversations found.</CommandEmpty>
        {conversationGroups.map((group) => (
          <CommandGroup key={group.label} heading={group.label}>
            {group.conversations.map((conversation) => {
              const isActive = currentConversationId === conversation.id;
              const displayTitle =
                conversation.title.length > 60
                  ? conversation.title.slice(0, 60) + "..."
                  : conversation.title;

              return (
                <CommandItem
                  key={conversation.id}
                  value={conversation.id}
                  onSelect={() => handleSelect(conversation.id)}
                  className="flex items-center gap-2"
                >
                  <MessageSquareIcon className="size-4 shrink-0 text-muted-foreground" />
                  {conversation.pinned && (
                    <PinIcon className="size-3 shrink-0 text-primary" />
                  )}
                  <span className={isActive ? "font-semibold" : ""}>
                    {displayTitle}
                  </span>
                  {isActive && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      Current
                    </span>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
