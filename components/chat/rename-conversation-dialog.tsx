"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateConversation } from "@/hooks/use-conversations";
import type { Conversation } from "@/lib/chat";

interface RenameConversationDialogProps {
  conversation: Conversation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RenameConversationDialog({
  conversation,
  open,
  onOpenChange,
}: RenameConversationDialogProps) {
  const [title, setTitle] = useState("");
  const updateConversationMutation = useUpdateConversation();

  // Update title when conversation changes
  useEffect(() => {
    if (conversation) {
      setTitle(conversation.title);
    }
  }, [conversation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!conversation || !title.trim()) {
      return;
    }

    updateConversationMutation.mutate(
      {
        id: conversation.id,
        data: { title: title.trim() },
      },
      {
        onSuccess: (result) => {
          if (!result.error) {
            onOpenChange(false);
          }
        },
      }
    );
  };

  const handleCancel = () => {
    onOpenChange(false);
    // Reset to original title
    if (conversation) {
      setTitle(conversation.title);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename conversation</DialogTitle>
            <DialogDescription>
              Give this conversation a new name to help you find it later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter conversation title"
                autoFocus
                maxLength={100}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={updateConversationMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !title.trim() ||
                title === conversation?.title ||
                updateConversationMutation.isPending
              }
            >
              {updateConversationMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
