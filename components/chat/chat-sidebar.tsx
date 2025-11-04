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

  // Filter conversations based on search
  const filteredConversations = searchConversations(
    MOCK_CONVERSATIONS,
    searchQuery,
  );

  // Group by recency
  const conversationGroups =
    groupConversationsByRecency(filteredConversations);

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-3">
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
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.conversations.map((conversation) => (
                    <SidebarMenuItem key={conversation.id}>
                      <SidebarMenuButton
                        isActive={currentConversationId === conversation.id}
                        onClick={() => onSelectConversation(conversation.id)}
                        className="w-full justify-start"
                      >
                        <div className="flex items-start gap-2 w-full min-w-0">
                          {conversation.pinned && (
                            <PinIcon className="size-3 mt-0.5 shrink-0 text-primary" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {conversation.title}
                            </div>
                            {conversation.preview && (
                              <div className="text-xs text-muted-foreground truncate">
                                {conversation.preview}
                              </div>
                            )}
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
                              console.log("Pin conversation:", conversation.id);
                            }}
                          >
                            <PinIcon className="size-3 mr-2" />
                            {conversation.pinned ? "Unpin" : "Pin"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log("Rename conversation:", conversation.id);
                            }}
                          >
                            <PencilIcon className="size-3 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log("Delete conversation:", conversation.id);
                            }}
                            className="text-destructive"
                          >
                            <Trash2Icon className="size-3 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  ))}
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
  );
}
