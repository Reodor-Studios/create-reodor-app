"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import { groupConversationsByRecency } from "@/lib/chat";
import {
  MessageSquarePlusIcon,
  SearchIcon,
  PinIcon,
  MoreVerticalIcon,
  Trash2Icon,
  PencilIcon,
  HistoryIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ConversationSearchDialog } from "@/components/chat/conversation-search-dialog";
import { ChatFloatingActions } from "@/components/chat/chat-floating-actions";
import { RenameConversationDialog } from "@/components/chat/rename-conversation-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useConversations,
  useUpdateConversation,
  useDeleteConversation,
  useDeleteAllConversations,
} from "@/hooks/use-conversations";
import type { Conversation } from "@/lib/chat";
import { BlurFade } from "../ui/blur-fade";
import Link from "next/link";

interface ChatSidebarProps {
  userId: string;
  currentConversationId?: string;
  onNewChat: () => void;
  onSelectConversation: (conversationId: string) => void;
}

export function ChatSidebar({
  userId,
  currentConversationId,
  onNewChat,
  onSelectConversation,
}: ChatSidebarProps) {
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [renameConversation, setRenameConversation] =
    useState<Conversation | null>(null);
  const [deleteConversation, setDeleteConversation] =
    useState<Conversation | null>(null);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);

  const { open, toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();

  // Fetch conversations from the database
  const { data: conversationsData, isLoading } = useConversations({ userId });
  const updateConversationMutation = useUpdateConversation();
  const deleteConversationMutation = useDeleteConversation();
  const deleteAllConversationsMutation = useDeleteAllConversations();

  // On desktop/tablet (>=768px), sidebar is always inline (collapsible="none")
  // On mobile (<768px), sidebar becomes a drawer (handled by Sidebar component's isMobile check)
  const collapsibleBehavior = isMobile ? "offcanvas" : "none";

  // Group all conversations by recency for sidebar display
  const conversations = conversationsData?.data || [];
  const conversationGroups = groupConversationsByRecency(conversations);

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
        className="border-r pt-16 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)] dark:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.3)]"
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
                      // Truncate title: 25 chars if pinned, 29 chars if not pinned
                      const charLimit = conversation.pinned ? 25 : 29;
                      const displayTitle =
                        conversation.title.length > charLimit
                          ? conversation.title.slice(0, charLimit) + "..."
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
                            className="w-full justify-start py-2 pr-2"
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
                                  updateConversationMutation.mutate({
                                    id: conversation.id,
                                    data: { pinned: !conversation.pinned },
                                  });
                                }}
                              >
                                <PinIcon className="size-3 mr-2" />
                                {conversation.pinned ? "Unpin" : "Pin"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenameConversation(conversation);
                                }}
                              >
                                <PencilIcon className="size-3 mr-2" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConversation(conversation);
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

            {!isLoading && conversations.length === 0 && (
              <BlurFade delay={0.2} duration={0.5} inView>
                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                  <MessageSquarePlusIcon className="size-8 mb-2" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs mt-1">Start a new chat to begin</p>
                </div>
              </BlurFade>
            )}
          </ScrollArea>
        </SidebarContent>

        <SidebarFooter className="border-t p-4">
          <div className="space-y-1">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground"
            >
              <Link href="/chat/history">
                <HistoryIcon className="size-4" />
                <span>Chat history</span>
              </Link>
            </Button>
            <Button
              onClick={() => setDeleteAllDialogOpen(true)}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              disabled={conversations.length === 0}
            >
              <Trash2Icon className="size-4" />
              <span>Delete all conversations</span>
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <ConversationSearchDialog
        userId={userId}
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        currentConversationId={currentConversationId}
        onSelectConversation={onSelectConversation}
      />

      <RenameConversationDialog
        conversation={renameConversation}
        open={renameConversation !== null}
        onOpenChange={(open) => {
          if (!open) setRenameConversation(null);
        }}
      />

      <AlertDialog
        open={deleteConversation !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConversation(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;
              {deleteConversation?.title}&quot;? This action cannot be undone
              and will permanently delete the conversation and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConversation) {
                  deleteConversationMutation.mutate(deleteConversation.id, {
                    onSuccess: () => {
                      // If deleting current conversation, reset to new chat
                      if (currentConversationId === deleteConversation.id) {
                        onNewChat();
                      }
                      setDeleteConversation(null);
                    },
                  });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteAllDialogOpen}
        onOpenChange={setDeleteAllDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all conversations</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all {conversations.length}{" "}
              conversation{conversations.length !== 1 ? "s" : ""}? This action
              cannot be undone and will permanently delete all conversations and
              their messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteAllConversationsMutation.mutate(userId, {
                  onSuccess: () => {
                    // Reset to new chat after deleting all
                    onNewChat();
                    setDeleteAllDialogOpen(false);
                  },
                });
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
