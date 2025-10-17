"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/kibo-ui/dropzone";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { X, FileIcon, Trash2, Upload as UploadIcon, CalendarIcon } from "lucide-react";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useUploadTodoAttachments } from "@/hooks/use-upload-todo-attachments";
import { upsertTodo, deleteTodo, deleteTodoAttachment } from "@/server/todo.actions";
import { createClient } from "@/lib/supabase/client";
import { getPublicUrl } from "@/lib/supabase/storage";
import type { DatabaseTables } from "@/types";

const todoFormSchema = z.object({
  title: z.string().min(1, "Tittel er påkrevd").max(200, "Tittel kan ikke være lengre enn 200 tegn"),
  description: z.string().max(1000, "Beskrivelse kan ikke være lengre enn 1000 tegn").optional(),
  completed: z.boolean(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  due_date: z.date().optional(),
});

type TodoFormData = z.infer<typeof todoFormSchema>;

type TodoWithMedia = DatabaseTables["todos"]["Row"] & {
  media?:
    | Array<{
        id: string;
        file_path: string;
        media_type: string;
      }>
    | null;
};

interface TodoFormProps {
  existingTodo?: TodoWithMedia | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const truncateFilename = (filename: string, maxLength: number = 25): string => {
  if (filename.length <= maxLength) return filename;
  const extension = filename.split('.').pop() || '';
  const nameWithoutExt = filename.slice(0, filename.lastIndexOf('.'));
  const truncatedName = nameWithoutExt.slice(0, maxLength - extension.length - 4);
  return `${truncatedName}...${extension}`;
};

const TruncatedDropzoneContent = ({ files }: { files: File[] }) => {
  const maxLabelItems = 3;

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <FileIcon className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="my-2 px-4 max-w-xs sm:max-w-none break-words text-wrap font-medium text-sm">
          <span className="block sm:inline">Dra og slipp filer her,</span>
          <span className="block sm:inline"> eller klikk for å velge</span>
        </p>
        <p className="px-4 max-w-xs sm:max-w-none text-wrap break-words text-muted-foreground text-xs">
          Maks 5 filer, kun bildefiler
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <UploadIcon size={16} />
      </div>
      <p className="my-2 px-4 max-w-xs sm:max-w-none break-words text-wrap font-medium text-sm">
        {files.length > maxLabelItems
          ? `${new Intl.ListFormat("nb-NO").format(
              files.slice(0, maxLabelItems).map((file) => truncateFilename(file.name))
            )} og ${files.length - maxLabelItems} flere`
          : new Intl.ListFormat("nb-NO").format(files.map((file) => truncateFilename(file.name)))}
      </p>
      <p className="px-4 max-w-xs sm:max-w-none text-wrap break-words text-muted-foreground text-xs">
        <span className="block sm:inline">Dra og slipp</span>
        <span className="block sm:inline"> eller klikk for å erstatte</span>
      </p>
    </div>
  );
};

export function TodoForm({ existingTodo, onSuccess, onCancel }: TodoFormProps) {
  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([]);
  const [fileProcessing, setFileProcessing] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [existingAttachments, setExistingAttachments] = React.useState<Array<{ id: string; file_path: string; media_type: string; publicUrl: string }>>([]);
  const queryClient = useQueryClient();
  const uploadFilesMutation = useUploadTodoAttachments();

  React.useEffect(() => {
    const supabase = createClient();
    const attachments = existingTodo?.media?.filter((m) => m.media_type === "todo_attachment") || [];
    const attachmentsWithUrls = attachments.map(attachment => ({
      ...attachment,
      publicUrl: getPublicUrl(supabase, "todo_attachments", attachment.file_path)
    }));
    setExistingAttachments(attachmentsWithUrls);
  }, [existingTodo]);

  const form = useForm<TodoFormData>({
    resolver: zodResolver(todoFormSchema),
    defaultValues: {
      title: existingTodo?.title || "",
      description: existingTodo?.description || "",
      completed: existingTodo?.completed || false,
      priority: existingTodo?.priority || undefined,
      due_date: existingTodo?.due_date ? new Date(existingTodo.due_date) : undefined,
    },
  });

  const todoMutation = useMutation({
    mutationFn: async (data: TodoFormData) => {
      const todoData: DatabaseTables["todos"]["Insert"] & { id?: string } = {
        title: data.title,
        description: data.description || null,
        completed: data.completed,
        priority: data.priority || null,
        due_date: data.due_date ? data.due_date.toISOString() : null,
        user_id: "",
      };

      if (existingTodo?.id) {
        todoData.id = existingTodo.id;
      }

      const result = await upsertTodo(todoData);
      if (result.error) {
        throw new Error(typeof result.error === "string" ? result.error : result.error.message);
      }
      return result.data;
    },
    onSuccess: async (data) => {
      toast.success(existingTodo ? "Oppgave oppdatert!" : "Oppgave opprettet!");

      if (uploadedFiles.length > 0 && data?.id) {
        try {
          toast.info(`Laster opp ${uploadedFiles.length} fil(er)...`);
          await uploadFilesMutation.mutateAsync({
            todoId: data.id,
            files: uploadedFiles,
          });
        } catch (error) {
          console.error("Failed to upload files:", error);
          toast.error("Oppgave opprettet, men kunne ikke laste opp filer");
        }
      }

      queryClient.invalidateQueries({ queryKey: ["todos"] });
      queryClient.invalidateQueries({ queryKey: ["todo"] });
      form.reset();
      setUploadedFiles([]);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Feil: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!existingTodo?.id) throw new Error("Ingen oppgave å slette");
      const result = await deleteTodo(existingTodo.id);
      if (result.error) {
        throw new Error(typeof result.error === "string" ? result.error : result.error.message);
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Oppgave slettet!");
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      queryClient.invalidateQueries({ queryKey: ["todo"] });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Feil ved sletting: ${error.message}`);
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: deleteTodoAttachment,
    onSuccess: (data) => {
      if (data.data?.id) {
        setExistingAttachments(prev => prev.filter(att => att.id !== data.data.id));
        toast.success("Fil slettet!");
        queryClient.invalidateQueries({ queryKey: ["todo"] });
        queryClient.invalidateQueries({ queryKey: ["todos"] });
      }
    },
    onError: (error) => {
      toast.error(`Feil ved sletting av fil: ${error.message}`);
    },
  });

  const handleDeleteAttachment = (attachmentId: string) => {
    deleteAttachmentMutation.mutate(attachmentId);
  };

  const handleSubmit = (data: TodoFormData) => {
    todoMutation.mutate(data);
  };

  const handleDrop = async (files: File[]) => {
    setFileProcessing(true);
    try {
      const processedFiles: File[] = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} er ikke en bildefil`);
          continue;
        }
        try {
          let compressedFile: File;
          if (file.size > 2 * 1024 * 1024) {
            compressedFile = await imageCompression(file, {
              maxSizeMB: 2,
              maxWidthOrHeight: 2048,
              useWebWorker: true,
              fileType: file.type,
              initialQuality: 0.85,
            });
          } else {
            compressedFile = file;
          }
          processedFiles.push(compressedFile);
        } catch (error) {
          console.error("Compression failed:", error);
          if (file.size <= 10 * 1024 * 1024) {
            processedFiles.push(file);
          }
        }
      }
      if (processedFiles.length > 0) {
        setUploadedFiles(prev => [...prev, ...processedFiles]);
        toast.success(`${processedFiles.length} fil(er) klar`);
      }
    } catch (error) {
      toast.error("Feil ved behandling av filer");
    } finally {
      setFileProcessing(false);
    }
  };

  const isLoading = todoMutation.isPending || uploadFilesMutation.isUploading || deleteMutation.isPending || deleteAttachmentMutation.isPending || fileProcessing;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tittel *</FormLabel>
              <FormControl>
                <Input placeholder="Skriv oppgave..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beskrivelse</FormLabel>
              <FormControl>
                <Textarea placeholder="Detaljer om oppgaven..." rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioritet</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg prioritet" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Lav</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">Høy</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Forfallsdato</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: nb })
                        ) : (
                          <span>Velg dato</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="completed"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Fullført</FormLabel>
                <FormDescription>Marker oppgaven som fullført</FormDescription>
              </div>
            </FormItem>
          )}
        />

        {existingAttachments.length > 0 && (
          <div className="space-y-4">
            <label className="text-sm font-medium">Eksisterende vedlegg</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {existingAttachments.map((att) => (
                <div key={att.id} className="relative aspect-square group">
                  <Image
                    src={att.publicUrl}
                    alt="Vedlegg"
                    fill
                    className="object-cover rounded-md"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteAttachment(att.id)}
                    disabled={isLoading}
                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <label className="text-sm font-medium">{existingAttachments.length > 0 ? "Last opp flere vedlegg" : "Vedlegg"}</label>
          <Dropzone
            accept={{ "image/*": [] }}
            maxFiles={5}
            maxSize={1024 * 1024 * 10}
            minSize={1024}
            onDrop={handleDrop}
            onError={(error) => toast.error(`Feil: ${error.message}`)}
            src={uploadedFiles}
            disabled={isLoading}
          >
            <DropzoneEmptyState>
              {fileProcessing ? (
                <div className="flex flex-col items-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <p className="my-2 text-sm">Behandler...</p>
                </div>
              ) : null}
            </DropzoneEmptyState>
            <TruncatedDropzoneContent files={uploadedFiles} />
          </Dropzone>

          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-muted px-2 py-1 rounded-md text-sm">
                  <span className="break-words">{truncateFilename(file.name, 20)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newFiles = [...uploadedFiles];
                      newFiles.splice(index, 1);
                      setUploadedFiles(newFiles);
                    }}
                    className="text-muted-foreground hover:text-destructive"
                    disabled={isLoading}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="w-full sm:w-auto">
              Avbryt
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:flex-1">
              {isLoading && <Spinner className="w-4 h-4 mr-2" />}
              {existingTodo ? "Oppdater oppgave" : "Opprett oppgave"}
            </Button>
          </div>

          {existingTodo && (
            <div className="border-t pt-4">
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" size="sm" disabled={isLoading} className="w-full">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Slett oppgave
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Slett oppgave</AlertDialogTitle>
                    <AlertDialogDescription>
                      Er du sikker på at du vil slette denne oppgaven? Denne handlingen kan ikke angres.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleteMutation.isPending}>Avbryt</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        deleteMutation.mutate();
                        setIsDeleteDialogOpen(false);
                      }}
                      disabled={deleteMutation.isPending}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deleteMutation.isPending && <Spinner className="w-4 h-4 mr-2" />}
                      Slett oppgave
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </form>
    </Form>
  );
}
