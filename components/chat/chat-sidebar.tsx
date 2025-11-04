"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  groupConversationsByRecency,
  MOCK_CONVERSATIONS,
  searchConversations,
  type Conversation,
} from "@/types/chat";
import {
  MessageSquarePlusIcon,
  SearchIcon,
  PinIcon,
  MoreVerticalIcon,
  Trash2Icon,
  PencilIcon,
  PanelLeftIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ChatSidebarProps {
  currentConversationId?: string;
  onNewChat: () => void;
  onSelectConversation: (conversationId: string) => void;
}

export function ChatSidebar({
  currentConversationId,
  onNewChat,
  onSelectConversation,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { open, toggleSidebar } = useSidebar();

  // Filter conversations based on search
  const filteredConversations = searchConversations(
    MOCK_CONVERSATIONS,
    searchQuery
  );

  // Group by recency
  const conversationGroups = groupConversationsByRecency(filteredConversations);

  const handleSearchClick = () => {
    if (!open) {
      toggleSidebar();
    }
    setIsSearchOpen(true);
    // Focus search input after sidebar opens
    setTimeout(() => {
      const searchInput = document.querySelector<HTMLInputElement>(
        'input[placeholder="Search conversations..."]'
      );
      searchInput?.focus();
    }, 100);
  };

  const handleNewChatClick = () => {
    if (!open) {
      toggleSidebar();
    }
    onNewChat();
  };

  return (
    <>
      {/* Floating trigger visible when sidebar is collapsed */}
      {!open && (
        <div className="fixed top-20 left-4 z-50 flex items-center gap-1 bg-secondary border rounded-lg p-1 shadow-lg">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="size-8"
            aria-label="Open sidebar"
          >
            <PanelLeftIcon className="size-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSearchClick}
            className="size-8"
            aria-label="Search conversations"
          >
            <SearchIcon className="size-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewChatClick}
            className="size-8"
            aria-label="New chat"
          >
            <MessageSquarePlusIcon className="size-4" />
          </Button>
        </div>
      )}

      <Sidebar>
        <SidebarHeader className="border-b p-4 pt-20">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Button
              onClick={onNewChat}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <MessageSquarePlusIcon className="size-4" />
              <span>New Chat</span>
            </Button>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <div className="p-3">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Separator />

          <ScrollArea className="flex-1">
            {conversationGroups.map((group) => (
              <SidebarGroup key={group.label} className="py-2">
                <SidebarGroupLabel className="mb-2">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1">
                    {group.conversations.map((conversation) => {
                      // Truncate title at 25 characters
                      const displayTitle =
                        conversation.title.length > 25
                          ? conversation.title.slice(0, 25) + "..."
                          : conversation.title;

                      return (
                        <SidebarMenuItem key={conversation.id} className="my-1">
                          <SidebarMenuButton
                            isActive={currentConversationId === conversation.id}
                            onClick={() =>
                              onSelectConversation(conversation.id)
                            }
                            className="w-full justify-start py-2"
                          >
                            <div className="flex items-center gap-2 w-full min-w-0">
                              {conversation.pinned && (
                                <PinIcon className="size-3 shrink-0 text-primary" />
                              )}
                              <div className="flex-1 min-w-0 font-medium text-sm">
                                {displayTitle}
                              </div>
                            </div>
                          </SidebarMenuButton>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100"
                              >
                                <MoreVerticalIcon className="size-3" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log(
                                    "Pin conversation:",
                                    conversation.id
                                  );
                                }}
                              >
                                <PinIcon className="size-3 mr-2" />
                                {conversation.pinned ? "Unpin" : "Pin"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log(
                                    "Rename conversation:",
                                    conversation.id
                                  );
                                }}
                              >
                                <PencilIcon className="size-3 mr-2" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log(
                                    "Delete conversation:",
                                    conversation.id
                                  );
                                }}
                                className="text-destructive"
                              >
                                <Trash2Icon className="size-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}

            {filteredConversations.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <SearchIcon className="size-8 mb-2" />
                <p className="text-sm">No conversations found</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            )}
          </ScrollArea>
        </SidebarContent>
      </Sidebar>
    </>
  );
}
