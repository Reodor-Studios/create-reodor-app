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
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      className="sm:max-w-[600px] lg:max-w-[700px]"
    >
      <CommandInput
        placeholder="Search conversations..."
        value={searchQuery}
        onValueChange={setSearchQuery}
        className="focus:ring-0 focus-visible:ring-0 focus:ring-offset-0"
      />
      <CommandList className="max-h-[500px] sm:max-h-[600px]">
        <CommandEmpty>No conversations found.</CommandEmpty>
        {conversationGroups.map((group) => (
          <CommandGroup key={group.label} heading={group.label}>
            {group.conversations.map((conversation) => {
              const isActive = currentConversationId === conversation.id;
              const displayTitle =
                conversation.title.length > 60
                  ? conversation.title.slice(0, 60) + "..."
                  : conversation.title;

              const displayPreview =
                conversation.preview && conversation.preview.length > 80
                  ? conversation.preview.slice(0, 80) + "..."
                  : conversation.preview;

              return (
                <CommandItem
                  key={conversation.id}
                  value={[
                    conversation.title,
                    ...(conversation.preview ?? ""),
                  ].join(" ")}
                  onSelect={() => handleSelect(conversation.id)}
                  className="flex items-start gap-2 py-3"
                >
                  {conversation.pinned && (
                    <PinIcon className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <span className={isActive ? "font-semibold" : ""}>
                      {displayTitle}
                    </span>
                    {displayPreview && (
                      <span className="text-xs text-muted-foreground truncate">
                        {displayPreview}
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <span className="ml-auto text-xs text-muted-foreground shrink-0">
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
