"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquarePlusIcon,
  SearchIcon,
  PanelLeftIcon,
} from "lucide-react";

interface ChatFloatingActionsProps {
  /**
   * Whether the sidebar is open
   */
  open: boolean;
  /**
   * Whether the viewport is mobile size
   */
  isMobile: boolean;
  /**
   * Callback to toggle the sidebar
   */
  onToggleSidebar: () => void;
  /**
   * Callback when search button is clicked
   */
  onSearchClick: () => void;
  /**
   * Callback when new chat button is clicked
   */
  onNewChatClick: () => void;
}

export function ChatFloatingActions({
  open,
  isMobile,
  onToggleSidebar,
  onSearchClick,
  onNewChatClick,
}: ChatFloatingActionsProps) {
  // Show floating actions only on mobile
  // On desktop/tablet, the sidebar is always visible and inline (part of the layout)
  const shouldShow = isMobile;

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed top-[4.5rem] left-2 z-50 flex items-center gap-1 bg-background/20 backdrop-blur-md border rounded-lg p-1 shadow-lg">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        className="size-8"
        aria-label="Open sidebar"
      >
        <PanelLeftIcon className="size-4" />
      </Button>
      <Separator orientation="vertical" className="h-6" />
      <Button
        variant="ghost"
        size="icon"
        onClick={onSearchClick}
        className="size-8"
        aria-label="Search conversations"
      >
        <SearchIcon className="size-4" />
      </Button>
      <Separator orientation="vertical" className="h-6" />
      <Button
        variant="ghost"
        size="icon"
        onClick={onNewChatClick}
        className="size-8"
        aria-label="New chat"
      >
        <MessageSquarePlusIcon className="size-4" />
      </Button>
    </div>
  );
}
