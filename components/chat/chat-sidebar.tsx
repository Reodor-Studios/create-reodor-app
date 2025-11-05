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
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ConversationSearchDialog } from "@/components/chat/conversation-search-dialog";
import { ChatFloatingActions } from "@/components/chat/chat-floating-actions";

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
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const { open, toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();

  // On desktop/tablet (>=768px), sidebar is always inline (collapsible="none")
  // On mobile (<768px), sidebar becomes a drawer (handled by Sidebar component's isMobile check)
  const collapsibleBehavior = isMobile ? "offcanvas" : "none";

  // Group all conversations by recency for sidebar display
  const conversationGroups = groupConversationsByRecency(MOCK_CONVERSATIONS);

  // Add cmd+k keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchDialogOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSearchClick = () => {
    setSearchDialogOpen(true);
  };

  const handleNewChatClick = () => {
    if (!open) {
      toggleSidebar();
    }
    onNewChat();
  };

  return (
    <>
      <ChatFloatingActions
        open={open}
        isMobile={isMobile}
        onToggleSidebar={toggleSidebar}
        onSearchClick={handleSearchClick}
        onNewChatClick={handleNewChatClick}
      />

      <Sidebar
        collapsible={collapsibleBehavior}
        className="border-r shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)] dark:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.3)]"
      >
        <SidebarHeader className="border-b p-4">
          <div className="flex items-center gap-2">
            {/* Only show toggle on mobile - on desktop, sidebar is always visible */}
            {isMobile && <SidebarTrigger className="-ml-1" />}
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
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground"
              onClick={handleSearchClick}
            >
              <SearchIcon className="size-4 mr-2" />
              <span>Search conversations...</span>
              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
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
                        <SidebarMenuItem
                          key={conversation.id}
                          className="my-1 group relative"
                        >
                          <SidebarMenuButton
                            isActive={currentConversationId === conversation.id}
                            onClick={() =>
                              onSelectConversation(conversation.id)
                            }
                            className="w-full justify-start py-2 pr-10"
                          >
                            <div className="flex items-center gap-2 w-full min-w-0">
                              {conversation.pinned && (
                                <PinIcon className="size-3 shrink-0 text-primary" />
                              )}
                              <div className="flex-1 min-w-0 font-medium text-sm truncate">
                                {displayTitle}
                              </div>
                            </div>
                          </SidebarMenuButton>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
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

            {MOCK_CONVERSATIONS.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <MessageSquarePlusIcon className="size-8 mb-2" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Start a new chat to begin</p>
              </div>
            )}
          </ScrollArea>
        </SidebarContent>
      </Sidebar>

      <ConversationSearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        currentConversationId={currentConversationId}
        onSelectConversation={onSelectConversation}
      />
    </>
  );
}
