"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Calendar, AlertCircle, FileText } from "lucide-react";
import { format, isPast } from "date-fns";
import { nb } from "date-fns/locale";
import Image from "next/image";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPublicUrl } from "@/lib/supabase/storage";
import { TodoDialog } from "./todo-dialog";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { upsertTodo } from "@/server/todo.actions";
import { toast } from "sonner";
import type { DatabaseTables } from "@/types";

type TodoCardProps = {
  todo: DatabaseTables["todos"]["Row"] & {
    media?:
      | {
          id: string;
          file_path: string;
          media_type: string;
        }[]
      | null;
  };
};

const priorityColors = {
  low: "bg-blue-100 text-blue-800 border-blue-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-red-100 text-red-800 border-red-200",
};

const priorityLabels = {
  low: "Lav",
  medium: "Middels",
  high: "Høy",
};

export function TodoCard({ todo }: TodoCardProps) {
  const [isTodoDialogOpen, setIsTodoDialogOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const queryClient = useQueryClient();

  const attachments =
    todo.media?.filter((m) => m.media_type === "todo_attachment") || [];
  const supabase = createClient();

  const getImageUrl = (filePath: string) => {
    return getPublicUrl(supabase, "todo_attachments", filePath);
  };

  const isOverdue =
    todo.due_date && !todo.completed && isPast(new Date(todo.due_date));

  const toggleCompletedMutation = useMutation({
    mutationFn: async (completed: boolean) => {
      const result = await upsertTodo({
        id: todo.id,
        title: todo.title,
        description: todo.description,
        completed,
        priority: todo.priority,
        due_date: todo.due_date,
        user_id: todo.user_id,
      });

      if (result.error) {
        throw new Error(
          typeof result.error === "string" ? result.error : result.error.message
        );
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      toast.success(
        todo.completed ? "Oppgave markert som uferdig" : "Oppgave fullført!"
      );
    },
    onError: (error) => {
      toast.error(`Feil ved oppdatering: ${error.message}`);
    },
  });

  const handleToggleCompleted = (checked: boolean | "indeterminate") => {
    if (checked === "indeterminate") return;
    toggleCompletedMutation.mutate(checked);
  };

  return (
    <Card
      className={`hover:shadow-md transition-shadow ${
        todo.completed ? "opacity-60" : ""
      }`}
    >
      <CardContent className="p-3 sm:p-6">
        {isMobile ? (
          /* Mobile Layout: Optimized vertical flow */
          <div className="space-y-3">
            {/* Mobile Header: Checkbox, title, and badges */}
            <div className="flex items-start gap-3">
              <Checkbox
                checked={todo.completed}
                onCheckedChange={handleToggleCompleted}
                disabled={toggleCompletedMutation.isPending}
                className="mt-1 flex-shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3
                    className={`font-medium text-sm break-words leading-tight ${
                      todo.completed ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {todo.title}
                  </h3>
                </div>

                {/* Mobile Badges: Priority, Due Date, Overdue */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {todo.priority && (
                    <Badge
                      variant="outline"
                      className={`text-xs ${priorityColors[todo.priority]}`}
                    >
                      {priorityLabels[todo.priority]}
                    </Badge>
                  )}
                  {todo.due_date && (
                    <Badge
                      variant="outline"
                      className={`text-xs flex items-center gap-1 ${
                        isOverdue
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-muted"
                      }`}
                    >
                      <Calendar className="w-3 h-3" />
                      {format(new Date(todo.due_date), "d. MMM", {
                        locale: nb,
                      })}
                    </Badge>
                  )}
                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Forfalt
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Description */}
            {todo.description && (
              <div className="bg-muted/30 rounded-lg p-2 border-l-2 border-muted">
                <p className="text-xs leading-relaxed break-words text-muted-foreground whitespace-pre-wrap">
                  {todo.description}
                </p>
              </div>
            )}

            {/* Mobile Attachments */}
            {attachments.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {attachments.slice(0, 3).map((attachment) => {
                  const isImage = attachment.file_path.match(
                    /\.(jpg|jpeg|png|gif|webp)$/i
                  );
                  return (
                    <div
                      key={attachment.id}
                      className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted"
                    >
                      {isImage ? (
                        <Image
                          src={getImageUrl(attachment.file_path)}
                          alt="Vedlegg"
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  );
                })}
                {attachments.length > 3 && (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <span className="text-xs text-muted-foreground font-medium">
                      +{attachments.length - 3}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTodoDialogOpen(true)}
                className="flex-1 justify-center"
              >
                <Edit className="w-3 h-3 mr-1" />
                Rediger
              </Button>
            </div>
          </div>
        ) : (
          /* Desktop Layout: Traditional side-by-side */
          <div className="flex gap-4">
            {/* Desktop Checkbox */}
            <Checkbox
              checked={todo.completed}
              onCheckedChange={handleToggleCompleted}
              disabled={toggleCompletedMutation.isPending}
              className="mt-1 flex-shrink-0"
            />

            <div className="flex-1 space-y-3">
              {/* Desktop Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3
                    className={`font-medium text-base break-words ${
                      todo.completed ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {todo.title}
                  </h3>

                  {/* Desktop Badges: Priority, Due Date, Overdue */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {todo.priority && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${priorityColors[todo.priority]}`}
                      >
                        {priorityLabels[todo.priority]}
                      </Badge>
                    )}
                    {todo.due_date && (
                      <Badge
                        variant="outline"
                        className={`text-xs flex items-center gap-1 ${
                          isOverdue
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-muted"
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        {format(new Date(todo.due_date), "d. MMMM yyyy", {
                          locale: nb,
                        })}
                      </Badge>
                    )}
                    {isOverdue && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Forfalt
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Desktop Description */}
              {todo.description && (
                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                  {todo.description}
                </p>
              )}

              {/* Desktop Attachments */}
              {attachments.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {attachments.slice(0, 4).map((attachment) => {
                    const isImage = attachment.file_path.match(
                      /\.(jpg|jpeg|png|gif|webp)$/i
                    );
                    return (
                      <div
                        key={attachment.id}
                        className="relative w-16 h-16 rounded-md overflow-hidden bg-muted"
                      >
                        {isImage ? (
                          <Image
                            src={getImageUrl(attachment.file_path)}
                            alt="Vedlegg"
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {attachments.length > 4 && (
                    <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        +{attachments.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Desktop Actions */}
              <div className="flex justify-end items-center gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTodoDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Rediger oppgave
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Todo Dialog for editing */}
      <TodoDialog
        open={isTodoDialogOpen}
        onOpenChange={setIsTodoDialogOpen}
        existingTodo={todo}
      />
    </Card>
  );
}
