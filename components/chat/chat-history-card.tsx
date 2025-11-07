"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import type { Conversation } from "@/lib/chat";
import { formatRelativeTime } from "@/lib/chat";
import {
  PinIcon,
  MoreVerticalIcon,
  Trash2Icon,
  PencilIcon,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  useUpdateConversation,
  useDeleteConversation,
} from "@/hooks/use-conversations";
import { useQueryClient } from "@tanstack/react-query";
import { RenameConversationDialog } from "@/components/chat/rename-conversation-dialog";
import { useRouter } from "next/navigation";

interface ChatHistoryCardProps {
  conversation: Conversation;
}

export function ChatHistoryCard({ conversation }: ChatHistoryCardProps) {
  const queryClient = useQueryClient();
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const updateConversationMutation = useUpdateConversation();
  const deleteConversationMutation = useDeleteConversation();

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

  const handlePin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateConversationMutation.mutate(
      {
        id: conversation.id,
        data: { pinned: !conversation.pinned },
      },
      {
        onSuccess: () => {
          // Invalidate both sidebar and chat history queries
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          queryClient.invalidateQueries({ queryKey: ["chat-history"] });
        },
      }
    );
  };

  const handleRename = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowRenameDialog(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteConversationMutation.mutate(conversation.id, {
      onSuccess: () => {
        // Invalidate both sidebar and chat history queries
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        queryClient.invalidateQueries({ queryKey: ["chat-history"] });
        setShowDeleteDialog(false);
      },
    });
  };

  return (
    <>
      <div className="relative group">
        <Link href={`/chat/${conversation.id}`}>
          <Card
            className={cn(
              "h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer",
              "border-border bg-card dark:bg-card"
            )}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start gap-2">
                <h3 className="font-semibold text-sm line-clamp-2 flex-1">
                  {displayTitle}
                </h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {displayPreview}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Last message {relativeTime}
                </p>
                {conversation.pinned && (
                  <PinIcon className="size-3 shrink-0 text-primary" />
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Actions menu - appears on hover */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
              <Button variant="ghost" size="icon" className="size-8 shadow-md">
                <MoreVerticalIcon className="size-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handlePin}>
                <PinIcon className="size-3 mr-2" />
                {conversation.pinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRename}>
                <PencilIcon className="size-3 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive"
              >
                <Trash2Icon className="size-3 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Rename Dialog */}
      <RenameConversationDialog
        conversation={conversation}
        open={showRenameDialog}
        onOpenChange={setShowRenameDialog}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{conversation.title}&quot;?
              This action cannot be undone and will permanently delete the
              conversation and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
