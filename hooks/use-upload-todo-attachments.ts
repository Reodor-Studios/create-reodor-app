import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import {
  bucketConfigs,
  storagePaths,
  uploadFile,
  validateFile,
} from "@/lib/supabase/storage";
import { useAuth } from "./use-auth";

interface UploadTodoAttachmentsParams {
  todoId: string;
  files: File[];
}

export const useUploadTodoAttachments = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const mutation = useMutation({
    mutationFn: async ({ todoId, files }: UploadTodoAttachmentsParams) => {
      const supabase = createClient();

      if (!profile) {
        throw new Error("Du må være logget inn for å laste opp filer");
      }

      const results = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate original file type
        const allowedTypes = [
          ...bucketConfigs["todo_attachments"].allowedTypes,
        ] as string[];
        if (!allowedTypes.includes(file.type)) {
          throw new Error(
            `Filtype ${file.type} er ikke tillatt. Tillatte typer: ${allowedTypes.join(", ")}`,
          );
        }

        // Compress the image before upload if it's an image
        let compressedFile: File;
        try {
          if (file.type.startsWith("image/")) {
            const maxSizeMB = bucketConfigs["todo_attachments"].maxSize / (1024 * 1024);

            // Only compress if file is larger than 2MB
            if (file.size > 2 * 1024 * 1024) {
              compressedFile = await imageCompression(file, {
                maxSizeMB: Math.min(maxSizeMB, 2),
                maxWidthOrHeight: 2048,
                useWebWorker: true,
                fileType: file.type,
                initialQuality: 0.85,
                alwaysKeepResolution: false,
              });

              const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(1);
              console.log(`Compressed todo attachment ${file.name}: ${compressionRatio}% reduction`);
            } else {
              compressedFile = file;
              console.log(`No compression needed for ${file.name}`);
            }
          } else {
            compressedFile = file;
          }
        } catch (compressionError) {
          console.error("Image compression failed:", compressionError);
          // If compression fails, use original file but validate size
          const validation = validateFile(
            file,
            allowedTypes,
            bucketConfigs["todo_attachments"].maxSize,
          );
          if (validation) {
            throw new Error(validation);
          }
          compressedFile = file;
        }

        // Generate storage path for new file
        const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${compressedFile.name.split(".").pop()}`;
        const storagePath = storagePaths.todoAttachment(todoId, profile.id, filename);

        // Upload compressed file to storage
        await uploadFile(supabase, {
          bucket: storagePath.bucket,
          path: storagePath.path,
          file: compressedFile,
          contentType: compressedFile.type,
        });

        // Get public URL for the new file
        const { data: urlData } = supabase.storage
          .from(storagePath.bucket)
          .getPublicUrl(storagePath.path);

        // Create new media record
        const { data: mediaData, error: mediaError } = await supabase
          .from("media")
          .insert({
            todo_id: todoId,
            file_path: storagePath.path,
            media_type: "todo_attachment",
            owner_id: profile.id,
          })
          .select()
          .single();

        if (mediaError) {
          throw new Error(
            `Failed to create media record: ${mediaError.message}`,
          );
        }

        results.push({
          ...mediaData,
          publicUrl: urlData.publicUrl,
        });
      }

      return results;
    },
    onSuccess: (data) => {
      // Invalidate todo queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      queryClient.invalidateQueries({ queryKey: ["todo"] });
      toast.success(`${data.length} fil(er) lastet opp!`);
    },
    onError: (error) => {
      toast.error("Feil ved opplasting av filer: " + error.message);
    },
  });

  return {
    ...mutation,
    // Expose loading state for components to use
    isUploading: mutation.isPending,
  };
};
