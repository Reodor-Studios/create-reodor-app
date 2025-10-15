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

interface UploadTodoAttachmentParams {
  todoId: string;
  files: File[];
}

export const useUploadTodoAttachment = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const mutation = useMutation({
    mutationFn: async ({ todoId, files }: UploadTodoAttachmentParams) => {
      const supabase = createClient();

      if (!profile) {
        throw new Error("You must be logged in to upload attachments");
      }

      const results = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        const allowedTypes = [
          ...bucketConfigs.todo_attachments.allowedTypes,
        ] as string[];

        if (!allowedTypes.includes(file.type)) {
          throw new Error(
            `File type ${file.type} is not allowed. Allowed types: ${
              allowedTypes.join(", ")
            }`,
          );
        }

        let processedFile: File = file;

        // Only compress images, not PDFs
        const isImage = file.type.startsWith("image/");

        if (isImage) {
          try {
            const maxSizeMB = bucketConfigs.todo_attachments.maxSize / (1024 * 1024);

            // Only compress if file is larger than 1MB
            if (file.size > 1024 * 1024) {
              processedFile = await imageCompression(file, {
                maxSizeMB: Math.min(maxSizeMB, 2), // Max 2MB but respect bucket limit
                maxWidthOrHeight: 1920, // Good resolution for attachments
                useWebWorker: true,
                fileType: file.type,
                initialQuality: 0.85,
                alwaysKeepResolution: false,
              });

              // Log compression results
              const compressionRatio = (
                ((1 - processedFile.size / file.size) * 100)
              ).toFixed(1);
              console.log(
                `Compressed ${file.name}: ${compressionRatio}% reduction, ` +
                `from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(processedFile.size / 1024 / 1024).toFixed(2)}MB`,
              );
            } else {
              console.log(
                `No compression needed for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
              );
            }
          } catch (compressionError) {
            console.error("Image compression failed:", compressionError);

            // If compression fails, use original file but validate size
            const validation = validateFile(
              file,
              allowedTypes,
              bucketConfigs.todo_attachments.maxSize,
            );

            if (validation) {
              throw new Error(validation);
            }

            processedFile = file;
          }
        } else {
          // For non-images (like PDFs), just validate size
          const validation = validateFile(
            file,
            allowedTypes,
            bucketConfigs.todo_attachments.maxSize,
          );

          if (validation) {
            throw new Error(validation);
          }
        }

        // Generate storage path
        const filename = `${Date.now()}-${
          Math.random().toString(36).substring(2, 15)
        }.${processedFile.name.split(".").pop()}`;

        const storagePath = storagePaths.todoAttachment(
          todoId,
          profile.id,
          filename,
        );

        // Upload file to storage
        await uploadFile(supabase, {
          bucket: storagePath.bucket,
          path: storagePath.path,
          file: processedFile,
          contentType: processedFile.type,
        });

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(storagePath.bucket)
          .getPublicUrl(storagePath.path);

        // Create media record
        const { data: mediaData, error: mediaError } = await supabase
          .from("media")
          .insert({
            owner_id: profile.id,
            file_path: storagePath.path,
            media_type: "todo_attachment",
            todo_id: todoId,
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
      toast.success(`${data.length} attachment(s) uploaded!`);
    },
    onError: (error) => {
      toast.error("Failed to upload attachment: " + error.message);
    },
  });

  return {
    ...mutation,
    // Expose loading state for components to use
    isUploading: mutation.isPending,
  };
};
