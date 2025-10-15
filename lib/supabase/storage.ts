import type { Database } from "@/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type MediaType = Database["public"]["Enums"]["media_type"];

export interface UploadOptions {
  bucket: string;
  path: string;
  file: File;
  contentType?: string;
}

export interface StoragePath {
  bucket: string;
  path: string;
}

/**
 * Generate storage paths for different file types
 */
export const storagePaths = {
  // User avatars
  avatar: (userId: string, filename: string): StoragePath => ({
    bucket: "avatars",
    path: `${userId}/${filename}`,
  }),

  // Todo attachments
  todoAttachment: (
    todoId: string,
    userId: string,
    filename: string,
  ): StoragePath => ({
    bucket: "todo_attachments",
    path: `${userId}/${todoId}/${filename}`,
  }),
};

/**
 * Upload a file to Supabase storage
 */
export async function uploadFile(
  supabase: SupabaseClient<Database>,
  { bucket, path, file, contentType }: UploadOptions,
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: contentType || file.type,
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return data;
}

/**
 * Get a public URL for a file (for public buckets)
 */
export function getPublicUrl(
  supabase: SupabaseClient<Database>,
  bucket: string,
  path: string,
) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Get a signed URL for a file (for private buckets)
 */
export async function getSignedUrl(
  supabase: SupabaseClient<Database>,
  bucket: string,
  path: string,
  expiresIn: number = 3600,
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Delete a file from storage
 */
export async function deleteFile(
  supabase: SupabaseClient<Database>,
  bucket: string,
  path: string,
) {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * List files in a bucket
 */
export async function listFiles(
  supabase: SupabaseClient<Database>,
  bucket: string,
  path?: string,
) {
  const { data, error } = await supabase.storage.from(bucket).list(path || "");

  if (error) {
    throw new Error(`List failed: ${error.message}`);
  }

  return data;
}

/**
 * Download a file
 */
export async function downloadFile(
  supabase: SupabaseClient<Database>,
  bucket: string,
  path: string,
) {
  const { data, error } = await supabase.storage.from(bucket).download(path);

  if (error) {
    throw new Error(`Download failed: ${error.message}`);
  }

  return data;
}

/**
 * Helper function to extract bucket and path from file_path stored in database
 * File paths are stored without bucket prefix, just as: "userId/filename.ext" or "userId/todoId/filename.ext"
 */
export function parseFilePath(
  filePath: string,
  mediaType?: MediaType,
): { bucket: string; path: string } {
  // Count the number of segments in the path
  const segments = filePath.split("/");

  // If the path starts with a known bucket name, extract it
  const knownBuckets = ["avatars", "todo_attachments"];

  if (knownBuckets.includes(segments[0])) {
    // Path includes bucket name as first segment
    return {
      bucket: segments[0],
      path: segments.slice(1).join("/"),
    };
  }

  // Otherwise, infer bucket from media type or path structure
  if (mediaType === "avatar") {
    return { bucket: "avatars", path: filePath };
  }

  if (mediaType === "todo_attachment" || segments.length === 3) {
    // Three segments typically means: userId/todoId/filename
    return { bucket: "todo_attachments", path: filePath };
  }

  if (segments.length === 2) {
    // Two segments typically means: userId/filename (avatar)
    return { bucket: "avatars", path: filePath };
  }

  // Default fallback
  return { bucket: "avatars", path: filePath };
}

/**
 * Get public URL from file_path stored in database
 * @param mediaType - Optional media type to help determine the correct bucket
 */
export function getPublicUrlFromPath(
  supabase: SupabaseClient<Database>,
  filePath: string,
  mediaType?: MediaType,
): string {
  // Handle external URLs (e.g., Unsplash)
  if (
    filePath.startsWith("http://") ||
    filePath.startsWith("https://")
  ) {
    return filePath;
  }

  const { bucket, path } = parseFilePath(filePath, mediaType);
  return getPublicUrl(supabase, bucket, path);
}

/**
 * Generate a unique filename with timestamp
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split(".").pop();
  return `${timestamp}-${randomString}.${extension}`;
}

/**
 * Bucket configurations for validation
 */
export const bucketConfigs = {
  avatars: {
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSize: 2 * 1024 * 1024, // 2MB
  },
  todo_attachments: {
    allowedTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
} as const;

/**
 * Validate file type and size before upload
 */
export function validateFile(
  file: File,
  allowedTypes: string[],
  maxSize: number,
): string | null {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return `File type ${file.type} is not allowed. Allowed types: ${
      allowedTypes.join(
        ", ",
      )
    }`;
  }

  // Check file size (maxSize in bytes)
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return `File size ${
      Math.round(
        file.size / (1024 * 1024),
      )
    }MB exceeds maximum size of ${maxSizeMB}MB`;
  }

  return null;
}
