`components/reviews/review-form.tsx`

```tsx
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
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/kibo-ui/spinner";
import { Rating, RatingButton } from "@/components/ui/kibo-ui/rating";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/kibo-ui/dropzone";
import { Badge } from "@/components/ui/badge";
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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { X, ImageIcon, Trash2, Upload as UploadIcon } from "lucide-react";
import Image from "next/image";
import imageCompression from "browser-image-compression";

import { useUploadReviewImages } from "@/hooks/use-upload-review-images";
import {
  upsertReview,
  deleteReview,
  deleteReviewImage,
} from "@/server/review.actions";
import { createClient } from "@/lib/supabase/client";
import { getPublicUrl } from "@/lib/supabase/storage";
import type { DatabaseTables } from "@/types";

const reviewFormSchema = z.object({
  rating: z.number().min(1, "Du må gi en vurdering").max(5),
  comment: z
    .string()
    .max(1000, "Kommentar kan ikke være lengre enn 1000 tegn")
    .optional(),
});

type ReviewFormData = z.infer<typeof reviewFormSchema>;

type ReviewWithMedia = DatabaseTables["reviews"]["Row"] & {
  media?: Array<{
    id: string;
    file_path: string;
    media_type: string;
  }>;
};

type ReviewImageWithPublicUrl = {
  id: string;
  file_path: string;
  media_type: string;
  publicUrl: string;
};

interface ReviewFormProps {
  bookingId: string;
  stylistName: string;
  serviceTitles: string[];
  existingReview?: ReviewWithMedia | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Helper function to truncate filename
const truncateFilename = (filename: string, maxLength: number = 25): string => {
  if (filename.length <= maxLength) return filename;

  const extension = filename.split(".").pop() || "";
  const nameWithoutExt = filename.slice(0, filename.lastIndexOf("."));
  const truncatedName = nameWithoutExt.slice(
    0,
    maxLength - extension.length - 4
  ); // -4 for "..." + "."

  return `${truncatedName}...${extension}`;
};

// Custom dropzone content with truncated filenames
const TruncatedDropzoneContent = ({ files }: { files: File[] }) => {
  const maxLabelItems = 3;

  // Show default empty state when no files
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <ImageIcon className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="my-2 px-4 max-w-xs sm:max-w-none break-words text-wrap font-medium text-sm">
          <span className="block sm:inline">Dra og slipp bilder her,</span>
          <span className="block sm:inline"> eller klikk for å velge</span>
        </p>
        <p className="px-4 max-w-xs sm:max-w-none text-wrap break-words text-muted-foreground text-xs">
          Maks 5 bilder, kun bildefiler
        </p>
      </div>
    );
  }

  // Show files when they exist
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <UploadIcon size={16} />
      </div>
      <p className="my-2 px-4 max-w-xs sm:max-w-none break-words text-wrap font-medium text-sm">
        {files.length > maxLabelItems
          ? `${new Intl.ListFormat("nb-NO").format(
              files
                .slice(0, maxLabelItems)
                .map((file) => truncateFilename(file.name))
            )} og ${files.length - maxLabelItems} flere`
          : new Intl.ListFormat("nb-NO").format(
              files.map((file) => truncateFilename(file.name))
            )}
      </p>
      <p className="px-4 max-w-xs sm:max-w-none text-wrap break-words text-muted-foreground text-xs">
        <span className="block sm:inline">Dra og slipp</span>
        <span className="block sm:inline"> eller klikk for å erstatte</span>
      </p>
    </div>
  );
};

export function ReviewForm({
  bookingId,
  stylistName,
  serviceTitles,
  existingReview,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([]);
  const [fileProcessing, setFileProcessing] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [existingImages, setExistingImages] = React.useState<
    ReviewImageWithPublicUrl[]
  >([]);
  const queryClient = useQueryClient();
  const uploadImagesMutation = useUploadReviewImages();

  // Update existing images when existingReview changes and generate public URLs
  React.useEffect(() => {
    const supabase = createClient();
    const images =
      existingReview?.media?.filter((m) => m.media_type === "review_image") ||
      [];

    // Generate public URLs for existing images
    const imagesWithPublicUrls = images.map((image) => ({
      ...image,
      publicUrl: getPublicUrl(supabase, "review-media", image.file_path),
    }));

    setExistingImages(imagesWithPublicUrls);
  }, [existingReview]);

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: existingReview?.rating || 0,
      comment: existingReview?.comment || "",
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const reviewData: DatabaseTables["reviews"]["Insert"] = {
        booking_id: bookingId,
        rating: data.rating,
        comment: data.comment || null,
        customer_id: "", // Will be set by the server action
        stylist_id: "", // Will be set by the server action
      };

      const result = await upsertReview(reviewData);
      if (result.error) {
        throw new Error(
          typeof result.error === "string" ? result.error : result.error.message
        );
      }
      return result.data;
    },
    onSuccess: async (data) => {
      toast.success(
        existingReview ? "Anmeldelse oppdatert!" : "Anmeldelse opprettet!"
      );

      // Upload images if any were selected
      if (uploadedFiles.length > 0 && data?.id) {
        try {
          toast.info(`Laster opp ${uploadedFiles.length} bilde(r)...`);
          await uploadImagesMutation.mutateAsync({
            reviewId: data.id,
            files: uploadedFiles,
          });
        } catch (error) {
          console.error("Failed to upload images:", error);
          toast.error("Anmeldelse opprettet, men kunne ikke laste opp bilder");
        }
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["review", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      queryClient.invalidateQueries({
        queryKey: ["booking-details", bookingId],
      });
      queryClient.invalidateQueries({
        queryKey: ["completedBookingsWithoutReviews"],
      });

      form.reset();
      setUploadedFiles([]);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(
        `Feil ved ${existingReview ? "oppdatering" : "opprettelse"} av anmeldelse: ${error.message}`
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!existingReview?.id) {
        throw new Error("Ingen anmeldelse å slette");
      }

      const result = await deleteReview(existingReview.id);
      if (result.error) {
        throw new Error(
          typeof result.error === "string" ? result.error : result.error.message
        );
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Anmeldelse slettet!");

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["review", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      queryClient.invalidateQueries({
        queryKey: ["booking-details", bookingId],
      });
      queryClient.invalidateQueries({
        queryKey: ["completedBookingsWithoutReviews"],
      });

      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Feil ved sletting av anmeldelse: ${error.message}`);
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: deleteReviewImage,
    onSuccess: (data) => {
      if (data.data?.id) {
        // Remove the image from local state
        setExistingImages((prev) =>
          prev.filter((img) => img.id !== data.data.id)
        );
        toast.success("Bilde slettet!");

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["review", bookingId] });
        queryClient.invalidateQueries({
          queryKey: ["booking-details", bookingId],
        });
      }
    },
    onError: (error) => {
      toast.error(`Feil ved sletting av bilde: ${error.message}`);
    },
  });

  const handleDeleteImage = (imageId: string) => {
    deleteImageMutation.mutate(imageId);
  };

  const handleSubmit = (data: ReviewFormData) => {
    reviewMutation.mutate(data);
  };

  const handleDrop = async (files: File[]) => {
    setFileProcessing(true);
    try {
      const processedFiles: File[] = [];
      const compressionErrors: Array<{ file: string; error: string }> = [];

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          compressionErrors.push({
            file: file.name,
            error: "Bare bildefiler er tillatt",
          });
          continue;
        }

        try {
          // Compress image with high quality settings for review images
          let compressedFile: File;

          // Check if compression is needed (file > 2MB)
          if (file.size > 2 * 1024 * 1024) {
            compressedFile = await imageCompression(file, {
              maxSizeMB: 2, // 2MB max size
              maxWidthOrHeight: 2400, // Higher resolution for review images
              useWebWorker: true,
              fileType: file.type,
              initialQuality: 0.9, // High quality starting point
              alwaysKeepResolution: false, // Allow resolution reduction if needed
            });

            // Log compression ratio for debugging
            const compressionRatio = (
              (1 - compressedFile.size / file.size) *
              100
            ).toFixed(1);
            console.log(
              `Compressed ${file.name}: ${compressionRatio}% reduction`
            );
          } else {
            compressedFile = file;
          }

          processedFiles.push(compressedFile);
        } catch (compressionError) {
          console.error("Compression failed for", file.name, compressionError);
          // If compression fails, try using original if it's under 10MB
          if (file.size <= 10 * 1024 * 1024) {
            processedFiles.push(file);
            toast.info(`${file.name} ble ikke komprimert, bruker original`);
          } else {
            compressionErrors.push({
              file: file.name,
              error: "Filen er for stor og kunne ikke komprimeres",
            });
          }
        }
      }

      if (processedFiles.length > 0) {
        setUploadedFiles((prev) => [...prev, ...processedFiles]);
        toast.success(`${processedFiles.length} bilde(r) klar for opplasting`);
      }

      if (compressionErrors.length > 0) {
        const errorMessage =
          compressionErrors.length === 1
            ? compressionErrors[0].error
            : `${compressionErrors.length} filer kunne ikke behandles`;
        toast.error(errorMessage);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Feil ved behandling av filer";
      toast.error("En feil oppstod ved behandling av filer", {
        description: message,
      });
    } finally {
      setFileProcessing(false);
    }
  };

  const isLoading =
    reviewMutation.isPending ||
    uploadImagesMutation.isUploading ||
    deleteMutation.isPending ||
    deleteImageMutation.isPending ||
    fileProcessing;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Service and stylist info */}
        <div className="space-y-2">
          <h3 className="text-base sm:text-lg font-semibold break-words">
            Vurder {stylistName} for tjenesten
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground break-words">
            {serviceTitles.length > 0
              ? serviceTitles.length === 1
                ? serviceTitles[0]
                : `${serviceTitles[0]} +${serviceTitles.length - 1} til`
              : "Tjeneste"}
          </p>
        </div>

        {/* Rating */}
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vurdering *</FormLabel>
              <FormControl>
                <Rating
                  value={field.value}
                  onValueChange={field.onChange}
                  className="text-yellow-500"
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <RatingButton key={star} />
                  ))}
                </Rating>
              </FormControl>
              <FormDescription className="break-words">
                Klikk på stjernene for å gi en vurdering fra 1 til 5
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Comment */}
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kommentar</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Fortell om din opplevelse..."
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormDescription className="break-words">
                Valgfritt: Del dine tanker om tjenesten og stylisten
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Existing Images */}
        {existingImages.length > 0 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 break-words">
                Eksisterende bilder
              </label>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                Bilder du har lastet opp tidligere
              </p>
            </div>

            <div className="aspect-video bg-muted rounded-xl relative overflow-hidden">
              {existingImages.length === 1 ? (
                <div className="aspect-video relative group">
                  <Image
                    src={existingImages[0].publicUrl}
                    alt={`Anmeldelse bilde`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(existingImages[0].id)}
                    disabled={isLoading}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Carousel
                  className="w-full h-full"
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                >
                  <CarouselContent>
                    {existingImages.map((image) => (
                      <CarouselItem key={image.id}>
                        <div className="aspect-video relative group">
                          <Image
                            src={image.publicUrl}
                            alt={`Anmeldelse bilde`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(image.id)}
                            disabled={isLoading}
                            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious
                    type="button"
                    className="left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border-0 shadow-md"
                  />
                  <CarouselNext
                    type="button"
                    className="right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border-0 shadow-md"
                  />
                </Carousel>
              )}
            </div>
          </div>
        )}

        {/* New Image upload */}
        <div className="space-y-4">
          <div>
            <label className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 break-words">
              {existingImages.length > 0 ? "Last opp flere bilder" : "Bilder"}
            </label>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
              Last opp bilder av resultatet (valgfritt)
            </p>
          </div>

          <Dropzone
            accept={{ "image/*": [] }}
            maxFiles={5}
            maxSize={1024 * 1024 * 10} // 10MB
            minSize={1024} // 1KB
            onDrop={handleDrop}
            onError={(error) => {
              toast.error(`Feil ved opplasting: ${error.message}`);
            }}
            src={uploadedFiles}
            disabled={isLoading}
          >
            <DropzoneEmptyState>
              {fileProcessing ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  </div>
                  <p className="my-2 w-full break-words text-wrap font-medium text-sm">
                    Behandler bilder...
                  </p>
                  <p className="w-full break-words text-wrap text-muted-foreground text-xs">
                    Komprimerer og validerer filer
                  </p>
                </div>
              ) : null}
            </DropzoneEmptyState>
            <TruncatedDropzoneContent files={uploadedFiles} />
          </Dropzone>

          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs sm:text-sm font-medium break-words">
                {uploadedFiles.length} bilde(r) klar for opplasting:
              </p>
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-muted px-2 py-1 rounded-md text-xs sm:text-sm min-w-0"
                  >
                    <span className="break-words min-w-0 flex-1">
                      {truncateFilename(file.name, 20)}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {(file.size / 1024 / 1024).toFixed(1)}MB
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newFiles = [...uploadedFiles];
                        newFiles.splice(index, 1);
                        setUploadedFiles(newFiles);
                        toast.success("Bilde fjernet");
                      }}
                      className="text-muted-foreground hover:text-destructive ml-1"
                      disabled={isLoading}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Avbryt
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:flex-1"
            >
              {isLoading && <Spinner className="w-4 h-4 mr-2" />}
              <span className="break-words">
                {reviewMutation.isPending
                  ? existingReview
                    ? "Oppdaterer anmeldelse..."
                    : "Oppretter anmeldelse..."
                  : uploadImagesMutation.isUploading
                    ? "Laster opp bilder..."
                    : existingReview
                      ? "Oppdater anmeldelse"
                      : "Publiser anmeldelse"}
              </span>
            </Button>
          </div>

          {/* Delete button - only show for existing reviews */}
          {existingReview && (
            <div className="border-t pt-4">
              <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Slett anmeldelse
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-[425px]">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="break-words">
                      Slett anmeldelse
                    </AlertDialogTitle>
                    <AlertDialogDescription className="break-words">
                      Er du sikker på at du vil slette denne anmeldelsen? Denne
                      handlingen kan ikke angres.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleteMutation.isPending}>
                      Avbryt
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        deleteMutation.mutate();
                        setIsDeleteDialogOpen(false);
                      }}
                      disabled={deleteMutation.isPending}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deleteMutation.isPending && (
                        <Spinner className="w-4 h-4 mr-2" />
                      )}
                      Slett anmeldelse
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
```

`components/reviews/review-dialog.tsx`

```tsx
"use client";

import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ReviewForm } from "./review-form";
import type { DatabaseTables } from "@/types";

type ReviewWithMedia = DatabaseTables["reviews"]["Row"] & {
  media?: Array<{
    id: string;
    file_path: string;
    media_type: string;
  }>;
};

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  stylistName: string;
  serviceTitles: string[];
  existingReview?: ReviewWithMedia | null;
}

export function ReviewDialog({
  open,
  onOpenChange,
  bookingId,
  stylistName,
  serviceTitles,
  existingReview,
}: ReviewDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const renderContent = ({ isInDrawer = false }) => (
    <div className={isInDrawer ? "flex flex-col h-full" : ""}>
      <div
        className={
          isInDrawer ? "flex-1 overflow-y-auto space-y-4 pr-4 pb-4" : ""
        }
      >
        <ReviewForm
          bookingId={bookingId}
          stylistName={stylistName}
          serviceTitles={serviceTitles}
          existingReview={existingReview}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] overflow-y-scroll max-h-screen">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl break-words">
              {existingReview ? "Rediger anmeldelse" : "Legg til anmeldelse"}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base break-words">
              {existingReview
                ? "Oppdater din anmeldelse og del din opplevelse"
                : "Del din opplevelse med andre brukere ved å skrive en anmeldelse"}
            </DialogDescription>
          </DialogHeader>
          {renderContent({ isInDrawer: false })}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[95vh]">
        <DrawerHeader className="text-left space-y-3 px-4 pt-4 pb-2">
          <DrawerTitle className="text-lg">
            {existingReview ? "Rediger anmeldelse" : "Legg til anmeldelse"}
          </DrawerTitle>
          <DrawerDescription className="text-sm">
            {existingReview
              ? "Oppdater din anmeldelse og del din opplevelse"
              : "Del din opplevelse med andre brukere ved å skrive en anmeldelse"}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 min-h-0 px-4 pb-4">
          {renderContent({ isInDrawer: true })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
```

`components/reviews/review-card.tsx`

```tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Star, ChevronRight, Edit } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPublicUrl } from "@/lib/supabase/storage";
import { ReviewDialog } from "./review-dialog";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

type ReviewCardProps = {
  review: {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    customer?: {
      id: string;
      full_name: string | null;
    } | null;
    stylist?: {
      id: string;
      full_name: string | null;
    } | null;
    booking?: {
      id: string;
      start_time: string;
      booking_services?:
        | {
            services?: {
              id: string;
              title: string | null;
            } | null;
          }[]
        | null;
    } | null;
    media?:
      | {
          id: string;
          file_path: string;
          media_type: string;
        }[]
      | null;
  };
  viewType: "customer" | "stylist"; // who is viewing the review
};

export function ReviewCard({ review, viewType }: ReviewCardProps) {
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const reviewImages =
    review.media?.filter((m) => m.media_type === "review_image") || [];
  const displayPerson =
    viewType === "customer" ? review.stylist : review.customer;
  const services =
    review.booking?.booking_services
      ?.map((bs) => bs.services?.title)
      .filter(Boolean) || [];

  const supabase = createClient();

  const getImageUrl = (filePath: string) => {
    return getPublicUrl(supabase, "review-media", filePath);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-6">
        {isMobile ? (
          /* Mobile Layout: Optimized vertical flow */
          <div className="space-y-3">
            {/* Mobile Header: Avatar, name, and rating in one row */}
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                <AvatarFallback className="text-xs">
                  {displayPerson?.full_name?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm break-words leading-tight">
                        {displayPerson?.full_name || "Ukjent bruker"}
                      </span>
                      {viewType === "customer" && (
                        <Badge
                          variant="outline"
                          className="text-xs flex-shrink-0"
                        >
                          Stylist
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(review.created_at), "d. MMM yyyy", {
                        locale: nb,
                      })}
                    </div>
                  </div>

                  {/* Mobile Rating - Compact */}
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Services */}
            {services.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {services.slice(0, 3).map((service, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {service}
                  </Badge>
                ))}
                {services.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{services.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Mobile Comment */}
            {review.comment && (
              <div className="bg-muted/30 rounded-lg p-2 border-l-2 border-muted">
                <p className="text-xs leading-relaxed break-words text-muted-foreground">
                  {review.comment}
                </p>
              </div>
            )}

            {/* Mobile Images */}
            {reviewImages.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {reviewImages.slice(0, 3).map((image) => (
                  <div
                    key={image.id}
                    className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0"
                  >
                    <Image
                      src={getImageUrl(image.file_path)}
                      alt="Anmeldelse bilde"
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                ))}
                {reviewImages.length > 3 && (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <span className="text-xs text-muted-foreground font-medium">
                      +{reviewImages.length - 3}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Actions */}
            <div className="flex gap-2 pt-2">
              {viewType === "customer" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReviewDialogOpen(true)}
                  className="flex-1 justify-center"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Rediger
                </Button>
              )}
              {review.booking && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="flex-1 justify-center"
                >
                  <Link href={`/bookinger/${review.booking.id}`}>
                    Booking
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Desktop Layout: Traditional side-by-side */
          <div className="flex gap-4">
            {/* Desktop Avatar */}
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {displayPerson?.full_name?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              {/* Desktop Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-base break-words">
                      {displayPerson?.full_name || "Ukjent bruker"}
                    </span>
                    {viewType === "customer" && (
                      <Badge
                        variant="outline"
                        className="text-xs flex-shrink-0"
                      >
                        Stylist
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(review.created_at), "d. MMMM yyyy", {
                      locale: nb,
                    })}
                  </div>
                </div>

                {/* Desktop Rating */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Desktop Services */}
              {services.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {services.slice(0, 2).map((service, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                  {services.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{services.length - 2}
                    </Badge>
                  )}
                </div>
              )}

              {/* Desktop Comment */}
              {review.comment && (
                <p className="text-sm leading-relaxed break-words">
                  {review.comment}
                </p>
              )}

              {/* Desktop Images */}
              {reviewImages.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {reviewImages.slice(0, 4).map((image) => (
                    <div
                      key={image.id}
                      className="relative w-16 h-16 rounded-md overflow-hidden"
                    >
                      <Image
                        src={getImageUrl(image.file_path)}
                        alt="Anmeldelse bilde"
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  ))}
                  {reviewImages.length > 4 && (
                    <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        +{reviewImages.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Desktop Actions */}
              <div className="flex justify-end items-center gap-2 pt-2 border-t">
                {viewType === "customer" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsReviewDialogOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Rediger anmeldelse
                  </Button>
                )}
                {review.booking && (
                  <Link
                    href={`/bookinger/${review.booking.id}`}
                    className={cn(
                      buttonVariants({
                        variant: "outline",
                        size: "sm",
                      }),
                      "flex items-center gap-2"
                    )}
                  >
                    Til booking
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Review Dialog for editing/deleting own reviews */}
      {viewType === "customer" && review.booking && (
        <ReviewDialog
          open={isReviewDialogOpen}
          onOpenChange={setIsReviewDialogOpen}
          bookingId={review.booking.id}
          stylistName={displayPerson?.full_name || "Stylisten"}
          serviceTitles={services.filter((s): s is string => Boolean(s))}
          existingReview={{
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            customer_id: review.customer?.id || "",
            stylist_id: review.stylist?.id || "",
            booking_id: review.booking.id,
            created_at: review.created_at,
            media: review.media || undefined,
          }}
        />
      )}
    </Card>
  );
}
```

`server/review.actions.ts`

```ts
"use server";

import { createClient } from "@/lib/supabase/server";
import type { DatabaseTables, ReviewFilters } from "@/types";
import { shouldReceiveNotificationServerSide } from "@/server/preferences.actions";
import { sendEmail } from "@/lib/resend-utils";
import { NewReviewNotificationEmail } from "@/transactional/emails/new-review-notification";
import { getNabostylistenLogoUrl } from "@/lib/supabase/utils";

export async function getReview(id: string) {
  const supabase = await createClient();
  return await supabase.from("reviews").select("*").eq("id", id);
}

export async function deleteReview(id: string) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (!user || userError) {
    return { error: "User not authenticated", data: null };
  }

  // Verify that the user is the author of the review
  const { data: existingReview, error: reviewError } = await supabase
    .from("reviews")
    .select("customer_id")
    .eq("id", id)
    .single();

  if (reviewError || !existingReview) {
    return { error: "Review not found", data: null };
  }

  if (existingReview.customer_id !== user.id) {
    return { error: "Not authorized to delete this review", data: null };
  }

  return await supabase.from("reviews").delete().eq("id", id);
}

export async function getReviewByBookingId(bookingId: string) {
  const supabase = await createClient();
  return await supabase
    .from("reviews")
    .select(
      `
            *,
            customer:profiles!reviews_customer_id_fkey(
                id,
                full_name
            ),
            stylist:profiles!reviews_stylist_id_fkey(
                id,
                full_name
            ),
            media(
                id,
                file_path,
                media_type
            )
        `
    )
    .eq("booking_id", bookingId)
    .single();
}

export async function getStylistReviews(
  stylistId: string,
  options: ReviewFilters = {}
) {
  const supabase = await createClient();

  const {
    page = 1,
    limit = 10,
    search,
    rating,
    reviewerIds,
    sortBy = "newest",
  } = options;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Build base query
  let reviewsQuery = supabase
    .from("reviews")
    .select(
      `
            *,
            customer:profiles!reviews_customer_id_fkey(
                id,
                full_name
            ),
            booking:bookings!reviews_booking_id_fkey(
                id,
                start_time,
                booking_services(
                    services(
                        id,
                        title
                    )
                )
            ),
            media(
                id,
                file_path,
                media_type
            )
        `
    )
    .eq("stylist_id", stylistId);

  let countQuery = supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("stylist_id", stylistId);

  // Apply filters
  if (search) {
    reviewsQuery = reviewsQuery.ilike("comment", `%${search}%`);
    countQuery = countQuery.ilike("comment", `%${search}%`);
  }

  if (rating) {
    reviewsQuery = reviewsQuery.eq("rating", rating);
    countQuery = countQuery.eq("rating", rating);
  }

  if (reviewerIds && reviewerIds.length > 0) {
    reviewsQuery = reviewsQuery.in("customer_id", reviewerIds);
    countQuery = countQuery.in("customer_id", reviewerIds);
  }

  // Apply sorting
  switch (sortBy) {
    case "oldest":
      reviewsQuery = reviewsQuery.order("created_at", {
        ascending: true,
      });
      break;
    case "highest":
      reviewsQuery = reviewsQuery
        .order("rating", { ascending: false })
        .order("created_at", { ascending: false });
      break;
    case "lowest":
      reviewsQuery = reviewsQuery
        .order("rating", { ascending: true })
        .order("created_at", { ascending: false });
      break;
    case "newest":
    default:
      reviewsQuery = reviewsQuery.order("created_at", {
        ascending: false,
      });
      break;
  }

  // Apply pagination
  reviewsQuery = reviewsQuery.range(from, to);

  const [{ data, error }, { count, error: countError }] = await Promise.all([
    reviewsQuery,
    countQuery,
  ]);

  if (error) {
    return { error: error.message, data: null, total: 0, totalPages: 0 };
  }

  if (countError) {
    return {
      error: countError.message,
      data: null,
      total: 0,
      totalPages: 0,
    };
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return { data, error: null, total, totalPages, currentPage: page };
}

export async function getCustomerReviews(
  customerId: string,
  options: ReviewFilters = {}
) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (!user || userError || user.id !== customerId) {
    return {
      error: "Unauthorized access",
      data: null,
      total: 0,
      totalPages: 0,
    };
  }

  const {
    page = 1,
    limit = 10,
    search,
    rating,
    reviewerIds,
    sortBy = "newest",
  } = options;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Build base query
  let reviewsQuery = supabase
    .from("reviews")
    .select(
      `
            *,
            stylist:profiles!reviews_stylist_id_fkey(
                id,
                full_name
            ),
            booking:bookings!reviews_booking_id_fkey(
                id,
                start_time,
                booking_services(
                    services(
                        id,
                        title
                    )
                )
            ),
            media(
                id,
                file_path,
                media_type
            )
        `
    )
    .eq("customer_id", customerId);

  let countQuery = supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("customer_id", customerId);

  // Apply filters
  if (search) {
    reviewsQuery = reviewsQuery.ilike("comment", `%${search}%`);
    countQuery = countQuery.ilike("comment", `%${search}%`);
  }

  if (rating) {
    reviewsQuery = reviewsQuery.eq("rating", rating);
    countQuery = countQuery.eq("rating", rating);
  }

  if (reviewerIds && reviewerIds.length > 0) {
    reviewsQuery = reviewsQuery.in("stylist_id", reviewerIds);
    countQuery = countQuery.in("stylist_id", reviewerIds);
  }

  // Apply sorting
  switch (sortBy) {
    case "oldest":
      reviewsQuery = reviewsQuery.order("created_at", {
        ascending: true,
      });
      break;
    case "highest":
      reviewsQuery = reviewsQuery
        .order("rating", { ascending: false })
        .order("created_at", { ascending: false });
      break;
    case "lowest":
      reviewsQuery = reviewsQuery
        .order("rating", { ascending: true })
        .order("created_at", { ascending: false });
      break;
    case "newest":
    default:
      reviewsQuery = reviewsQuery.order("created_at", {
        ascending: false,
      });
      break;
  }

  // Apply pagination
  reviewsQuery = reviewsQuery.range(from, to);

  const [{ data, error }, { count, error: countError }] = await Promise.all([
    reviewsQuery,
    countQuery,
  ]);

  if (error) {
    return { error: error.message, data: null, total: 0, totalPages: 0 };
  }

  if (countError) {
    return {
      error: countError.message,
      data: null,
      total: 0,
      totalPages: 0,
    };
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return { data, error: null, total, totalPages, currentPage: page };
}

export async function upsertReview(
  review: DatabaseTables["reviews"]["Insert"]
) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (!user || userError) {
    return { error: "User not authenticated", data: null };
  }

  // Verify that the user is the customer of the booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("customer_id, stylist_id, status")
    .eq("id", review.booking_id)
    .single();

  if (bookingError || !booking) {
    return { error: "Booking not found", data: null };
  }

  if (booking.customer_id !== user.id) {
    return { error: "Not authorized to review this booking", data: null };
  }

  if (booking.status !== "completed") {
    return { error: "Can only review completed bookings", data: null };
  }

  // Check if review already exists for this booking
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("booking_id", review.booking_id)
    .single();

  // Set customer_id and stylist_id from booking
  const reviewData = {
    ...review,
    customer_id: booking.customer_id,
    stylist_id: booking.stylist_id,
  };

  if (existingReview) {
    // Update existing review
    const updateData: DatabaseTables["reviews"]["Update"] = {
      rating: reviewData.rating,
      comment: reviewData.comment,
    };

    return await supabase
      .from("reviews")
      .update(updateData)
      .eq("id", existingReview.id)
      .select()
      .single();
  } else {
    // Create new review - use the same logic as createReview for notifications
    const result = await supabase
      .from("reviews")
      .insert(reviewData)
      .select()
      .single();

    if (result.error || !result.data) {
      return result;
    }

    // Send email notification to stylist if they have review notifications enabled
    try {
      console.log(
        "[REVIEW_DEBUG] Checking stylist review notification preferences..."
      );

      // Check if stylist wants to receive review notifications
      const shouldSendNotification = await shouldReceiveNotificationServerSide(
        booking.stylist_id,
        "review_notifications"
      );

      if (!shouldSendNotification) {
        console.log(
          `[REVIEW_NOTIFICATION] Stylist ${booking.stylist_id} has disabled review notifications - skipping email`
        );
        return result;
      }

      console.log(
        `[REVIEW_DEBUG] Stylist has enabled review notifications - proceeding with email...`
      );

      // Get additional data for email
      const { data: fullBookingData } = await supabase
        .from("bookings")
        .select(
          `
                        *,
                        booking_services(
                            services(
                                title
                            )
                        ),
                        customer:profiles!customer_id(
                            full_name,
                            email
                        ),
                        stylist:profiles!stylist_id(
                            id,
                            full_name,
                            email
                        )
                    `
        )
        .eq("id", review.booking_id)
        .single();

      console.log(
        "[REVIEW_DEBUG] Full booking data:",
        JSON.stringify(fullBookingData, null, 2)
      );

      if (fullBookingData?.stylist?.email) {
        // Send notification email using sendEmail utility with simplified template
        const { error: reviewEmailError } = await sendEmail({
          to: [fullBookingData.stylist.email],
          subject: `Ny ${result.data.rating}-stjerner anmeldelse fra ${fullBookingData.customer?.full_name || "kunde"}`,
          react: NewReviewNotificationEmail({
            logoUrl: getNabostylistenLogoUrl(),
            stylistName: fullBookingData.stylist.full_name || "Stylist",
            customerName: fullBookingData.customer?.full_name || "Kunde",
            rating: result.data.rating.toString(),
            comment: result.data.comment || undefined,
            stylistProfileId: booking.stylist_id,
          }),
        });

        if (reviewEmailError) {
          console.error(
            "Error sending review notification email:",
            reviewEmailError
          );
        }

        console.log(
          `[REVIEW_NOTIFICATION] Sent review notification for review ${result.data.id} to ${fullBookingData.stylist.email}`
        );
      }
    } catch (error) {
      // Don't fail the review creation if email notification fails
      console.error(
        "[REVIEW_NOTIFICATION] Failed to send review notification:",
        error
      );
    }

    return result;
  }
}

export async function getStylistAverageRating(stylistId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("stylist_id", stylistId);

  if (error) {
    return { error: error.message, average: 0, count: 0 };
  }

  if (!data || data.length === 0) {
    return { error: null, average: 0, count: 0 };
  }

  const totalRating = data.reduce((sum, review) => sum + review.rating, 0);
  const average = Number((totalRating / data.length).toFixed(1));

  return { error: null, average, count: data.length };
}

/**
 * Gets completed bookings that the user hasn't reviewed yet.
 * Always returns bookings where the user was the CUSTOMER, regardless of their current role.
 * This means stylists will see review alerts for bookings where they were customers.
 */
export async function getCompletedBookingsWithoutReviews(
  userId: string,
  userRole?: "customer" | "stylist" | "admin"
) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (!user || userError || user.id !== userId) {
    return { error: "Unauthorized access", data: null };
  }

  // Always show bookings where the user was the customer (regardless of their current role)
  // A stylist can also be a customer in other bookings and should see review alerts for those
  let query = supabase
    .from("bookings")
    .select(
      `
            id,
            start_time,
            customer_id,
            stylist_id,
            stylist:profiles!bookings_stylist_id_fkey(
                id,
                full_name
            ),
            customer:profiles!bookings_customer_id_fkey(
                id,
                full_name
            ),
            booking_services(
                services(
                    id,
                    title
                )
            )
        `
    )
    .eq("status", "completed")
    .eq("customer_id", userId); // Always filter by customer_id, not user role

  // Exclude bookings that already have reviews by this customer
  const { data: existingReviews } = await supabase
    .from("reviews")
    .select("booking_id")
    .eq("customer_id", userId);

  const reviewedBookingIds = existingReviews?.map((r) => r.booking_id) || [];
  if (reviewedBookingIds.length > 0) {
    query = query.not("id", "in", `(${reviewedBookingIds.join(",")})`);
  }

  const { data, error } = await query.order("start_time", { ascending: false });

  return { data, error };
}

export async function deleteReviewImage(imageId: string) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (!user || userError) {
    return { error: "User not authenticated", data: null };
  }

  // Get the image and verify ownership through the review
  const { data: image, error: imageError } = await supabase
    .from("media")
    .select(
      `
            id,
            review_id,
            file_path,
            reviews!inner(customer_id)
        `
    )
    .eq("id", imageId)
    .eq("media_type", "review_image")
    .single();

  if (imageError || !image) {
    return { error: "Review image not found", data: null };
  }

  // Verify that the user owns the review
  if (image.reviews.customer_id !== user.id) {
    return { error: "Not authorized to delete this image", data: null };
  }

  // Delete the file from storage
  const { error: storageError } = await supabase.storage
    .from("review-media")
    .remove([image.file_path]);

  if (storageError) {
    console.error("Failed to delete image from storage:", storageError);
    // Continue with database deletion even if storage deletion fails
  }

  // Delete the media record
  const { error: deleteError } = await supabase
    .from("media")
    .delete()
    .eq("id", imageId);

  if (deleteError) {
    return { error: deleteError.message, data: null };
  }

  return { error: null, data: { id: imageId } };
}

export async function getReviewers(
  userId: string,
  viewType: "customer" | "stylist"
) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (!user || userError || user.id !== userId) {
    return { error: "Unauthorized access", data: null };
  }

  if (viewType === "stylist") {
    // Get customers who have reviewed this stylist
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
                customer_id,
                customer:profiles!reviews_customer_id_fkey(
                    id,
                    full_name
                )
            `
      )
      .eq("stylist_id", userId)
      .not("customer", "is", null);

    if (error) {
      return { error: error.message, data: null };
    }

    // Remove duplicates and format for combobox
    const uniqueCustomers = data
      .filter(
        (review, index, self) =>
          index === self.findIndex((r) => r.customer_id === review.customer_id)
      )
      .map((review) => ({
        value: review.customer_id,
        label: review.customer?.full_name || "Unknown Customer",
      }))
      .filter((customer) => customer.label !== "Unknown Customer");

    return { error: null, data: uniqueCustomers };
  } else {
    // Get stylists this customer has reviewed
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
                stylist_id,
                stylist:profiles!reviews_stylist_id_fkey(
                    id,
                    full_name
                )
            `
      )
      .eq("customer_id", userId)
      .not("stylist", "is", null);

    if (error) {
      return { error: error.message, data: null };
    }

    // Remove duplicates and format for combobox
    const uniqueStylists = data
      .filter(
        (review, index, self) =>
          index === self.findIndex((r) => r.stylist_id === review.stylist_id)
      )
      .map((review) => ({
        value: review.stylist_id,
        label: review.stylist?.full_name || "Unknown Stylist",
      }))
      .filter((stylist) => stylist.label !== "Unknown Stylist");

    return { error: null, data: uniqueStylists };
  }
}
```

`hooks/use-upload-review-images.ts`

```ts
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

interface UploadReviewImagesParams {
  reviewId: string;
  files: File[];
}

export const useUploadReviewImages = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const mutation = useMutation({
    mutationFn: async ({ reviewId, files }: UploadReviewImagesParams) => {
      const supabase = createClient();

      if (!profile) {
        throw new Error("Du må være logget inn for å opplaste bilder");
      }

      const results = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Validate original file type
        const allowedTypes = [
          ...bucketConfigs["review-media"].allowedTypes,
        ] as string[];
        if (!allowedTypes.includes(file.type)) {
          throw new Error(
            `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(
              ", "
            )}`
          );
        }

        // Compress the image before upload (high quality for review images)
        let compressedFile: File;
        try {
          const maxSizeMB =
            bucketConfigs["review-media"].maxSize / (1024 * 1024);

          // Only compress if file is larger than 2MB
          if (file.size > 2 * 1024 * 1024) {
            compressedFile = await imageCompression(file, {
              maxSizeMB: Math.min(maxSizeMB, 2), // Max 2MB but respect bucket limit
              maxWidthOrHeight: 2400, // Higher resolution for review images
              useWebWorker: true,
              fileType: file.type,
              initialQuality: 0.9, // High quality starting point
              alwaysKeepResolution: false, // Allow resolution reduction if needed
            });

            // Log compression results
            const compressionRatio = (
              (1 - compressedFile.size / file.size) *
              100
            ).toFixed(1);
            console.log(`Compressed review image ${file.name}: ${compressionRatio}% reduction,
                                    from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
          } else {
            // File is already small enough, no compression needed
            compressedFile = file;
            console.log(
              `No compression needed for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`
            );
          }
        } catch (compressionError) {
          console.error("Image compression failed:", compressionError);
          // If compression fails, use original file but validate size
          const validation = validateFile(
            file,
            allowedTypes,
            bucketConfigs["review-media"].maxSize
          );
          if (validation) {
            throw new Error(validation);
          }
          compressedFile = file;
        }

        // Generate storage path for new file
        const filename = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 15)}.${compressedFile.name.split(".").pop()}`;
        const storagePath = storagePaths.reviewMedia(reviewId, filename);

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
            review_id: reviewId,
            file_path: storagePath.path,
            media_type: "review_image",
            is_preview_image: false,
            owner_id: profile.id,
          })
          .select()
          .single();

        if (mediaError) {
          throw new Error(
            `Failed to create media record: ${mediaError.message}`
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
      // Invalidate review queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["review"] });
      toast.success(`${data.length} bilde(r) lastet opp!`);
    },
    onError: (error) => {
      toast.error("Feil ved opplasting av bilder: " + error.message);
    },
  });

  return {
    ...mutation,
    // Expose loading state for components to use
    isUploading: mutation.isPending,
  };
};
```

`components/reviews/reviews-list.tsx`

```tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedState } from "@mantine/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ReviewCard } from "./review-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getStylistReviews,
  getCustomerReviews,
  getReviewers,
} from "@/server/review.actions";
import {
  Search,
  Star,
  Filter,
  X,
  Users,
  Check,
  ChevronsUpDown,
  ChevronRight,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { ReviewFilters } from "@/types";

interface ReviewsListProps {
  userId: string;
  viewType: "customer" | "stylist"; // customer viewing their own reviews, stylist viewing reviews about them
  showFilters?: boolean;
}

export function ReviewsList({
  userId,
  viewType,
  showFilters = true,
}: ReviewsListProps) {
  const limit = 6;
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Local filter state
  const [filters, setFilters] = useState<ReviewFilters>({
    search: "",
    rating: undefined,
    reviewerIds: [],
    sortBy: "newest",
    page: 1,
    limit,
  });

  // Debounced search state
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useDebouncedState("", 250);

  // Popover state
  const [reviewerPopoverOpen, setReviewerPopoverOpen] = useState(false);

  // Update filters when debounced search changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      search: debouncedSearch || undefined,
      page: 1,
    }));
  }, [debouncedSearch]);

  const updateFilters = (newFilters: Partial<ReviewFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  // Query with proper filters
  const { data, isLoading, error } = useQuery({
    queryKey: ["reviews", userId, viewType, filters],
    queryFn: async () => {
      if (viewType === "stylist") {
        return await getStylistReviews(userId, filters);
      } else {
        return await getCustomerReviews(userId, filters);
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Query reviewers for combobox
  const { data: reviewers } = useQuery({
    queryKey: ["reviewers", userId, viewType],
    queryFn: async () => {
      const result = await getReviewers(userId, viewType);
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handlePageChange = (page: number) => {
    updateFilters({ page });
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setDebouncedSearch(value);
  };

  const handleRatingFilterChange = (value: string) => {
    const rating = value === "all" ? undefined : parseInt(value);
    updateFilters({ rating, page: 1 });
  };

  const handleSortChange = (value: string) => {
    updateFilters({ sortBy: value as ReviewFilters["sortBy"], page: 1 });
  };

  const handleReviewerToggle = (reviewerId: string) => {
    const currentIds = filters.reviewerIds || [];
    const newIds = currentIds.includes(reviewerId)
      ? currentIds.filter((id) => id !== reviewerId)
      : [...currentIds, reviewerId];

    updateFilters({
      reviewerIds: newIds.length > 0 ? newIds : undefined,
      page: 1,
    });
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setFilters({
      search: "",
      rating: undefined,
      reviewerIds: [],
      sortBy: "newest",
      page: 1,
      limit,
    });
  };

  const hasActiveFilters =
    (filters.search && filters.search.length > 0) ||
    filters.rating ||
    (filters.reviewerIds && filters.reviewerIds.length > 0) ||
    (filters.sortBy && filters.sortBy !== "newest");

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Kunne ikke laste anmeldelser. Prøv igjen senere.
        </p>
      </div>
    );
  }

  const isEmpty = !data?.data || data.data.length === 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with stats */}
      {data?.total ? (
        <Badge variant="secondary" className="text-xs sm:text-sm">
          {data.total} totalt
        </Badge>
      ) : null}

      {/* Filters */}
      {showFilters && (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:gap-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={
                    isMobile
                      ? "Søk..."
                      : `Søk i ${viewType === "stylist" ? "anmeldelser..." : "mine anmeldelser..."}`
                  }
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Second row: Rating and Reviewer filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
              {/* Rating filter */}
              <Select
                value={filters.rating?.toString() || "all"}
                onValueChange={handleRatingFilterChange}
              >
                <SelectTrigger className="w-full">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue
                    placeholder={isMobile ? "Rating" : "Alle vurderinger"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle vurderinger</SelectItem>
                  <SelectItem value="5">5 stjerner</SelectItem>
                  <SelectItem value="4">4 stjerner</SelectItem>
                  <SelectItem value="3">3 stjerner</SelectItem>
                  <SelectItem value="2">2 stjerner</SelectItem>
                  <SelectItem value="1">1 stjerne</SelectItem>
                </SelectContent>
              </Select>

              {/* Reviewer Filter */}
              <Popover
                open={reviewerPopoverOpen}
                onOpenChange={setReviewerPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={reviewerPopoverOpen}
                    className="w-full justify-between"
                  >
                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      {filters.reviewerIds && filters.reviewerIds.length > 0
                        ? `${filters.reviewerIds.length} valgt`
                        : isMobile
                          ? viewType === "stylist"
                            ? "Kunder..."
                            : "Stylister..."
                          : viewType === "stylist"
                            ? "Velg kunder..."
                            : "Velg stylister..."}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[calc(100vw-2rem)] max-w-sm p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput
                      placeholder={
                        isMobile
                          ? "Søk..."
                          : `Søk ${viewType === "stylist" ? "kunder" : "stylister"}...`
                      }
                    />
                    <CommandList>
                      {!reviewers || reviewers.length === 0 ? (
                        <CommandEmpty>
                          Ingen{" "}
                          {viewType === "stylist" ? "kunder" : "stylister"}{" "}
                          funnet.
                        </CommandEmpty>
                      ) : (
                        <>
                          <CommandEmpty>
                            Ingen{" "}
                            {viewType === "stylist" ? "kunder" : "stylister"}{" "}
                            funnet.
                          </CommandEmpty>
                          <CommandGroup>
                            <ScrollArea className="h-40">
                              {reviewers.map((reviewer) => {
                                const isSelected =
                                  filters.reviewerIds?.includes(
                                    reviewer.value
                                  ) || false;
                                return (
                                  <CommandItem
                                    key={reviewer.value}
                                    value={reviewer.label}
                                    onSelect={() =>
                                      handleReviewerToggle(reviewer.value)
                                    }
                                  >
                                    {isSelected ? (
                                      <Check className={cn("mr-2 h-4 w-4")} />
                                    ) : (
                                      <ChevronRight className="mr-2 h-4 w-4" />
                                    )}
                                    {reviewer.label}
                                  </CommandItem>
                                );
                              })}
                            </ScrollArea>
                          </CommandGroup>
                          <CommandSeparator />
                          <CommandGroup>
                            <CommandItem
                              onSelect={() => {
                                updateFilters({ reviewerIds: [], page: 1 });
                                setReviewerPopoverOpen(false);
                              }}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Fjern alle valgte
                            </CommandItem>
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Sort */}
              <Select
                value={filters.sortBy || "newest"}
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={isMobile ? "Sortering" : "Sorter etter"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Nyeste først</SelectItem>
                  <SelectItem value="oldest">Eldste først</SelectItem>
                  <SelectItem value="highest">Høyest vurdering</SelectItem>
                  <SelectItem value="lowest">Lavest vurdering</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filters display */}
          {hasActiveFilters && (
            <div className="space-y-2">
              <span className="text-xs sm:text-sm text-muted-foreground block">
                Aktive filtre:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {filters.search && filters.search.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Søk: {filters.search}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleSearchChange("")}
                    />
                  </Badge>
                )}
                {filters.rating && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {filters.rating} stjerner
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() =>
                        updateFilters({ rating: undefined, page: 1 })
                      }
                    />
                  </Badge>
                )}
                {filters.reviewerIds && filters.reviewerIds.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {filters.reviewerIds.length === 1
                      ? reviewers?.find(
                          (r) => r.value === filters.reviewerIds?.[0]
                        )?.label || "Valgt person"
                      : `${filters.reviewerIds.length} ${viewType === "stylist" ? "kunder" : "stylister"}`}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() =>
                        updateFilters({ reviewerIds: [], page: 1 })
                      }
                    />
                  </Badge>
                )}
                {filters.sortBy && filters.sortBy !== "newest" && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {filters.sortBy === "oldest"
                      ? "Eldste først"
                      : filters.sortBy === "highest"
                        ? "Høyest vurdering"
                        : filters.sortBy === "lowest"
                          ? "Lavest vurdering"
                          : filters.sortBy}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() =>
                        updateFilters({ sortBy: "newest", page: 1 })
                      }
                    />
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  disabled={false}
                  className="text-xs sm:text-sm"
                >
                  <X className="w-4 h-4 mr-1" />
                  {isMobile ? "Nullstill" : "Nullstill alle"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reviews, Loading, or Empty State */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="text-center py-8 sm:py-12">
          <Star className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium mb-2">
            {hasActiveFilters
              ? "Ingen anmeldelser funnet"
              : "Ingen anmeldelser ennå"}
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground px-4">
            {hasActiveFilters
              ? "Prøv å justere filtrene dine for å se flere resultater."
              : viewType === "stylist"
                ? "Du har ikke mottatt noen anmeldelser ennå."
                : "Du har ikke skrevet noen anmeldelser ennå."}
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="mt-4"
            >
              <X className="w-4 h-4 mr-2" />
              Nullstill filtre
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {data.data.map((review) => (
            <ReviewCard key={review.id} review={review} viewType={viewType} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !isEmpty && data.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent className="flex-wrap gap-1">
              {(filters.page || 1) > 1 && (
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange((filters.page || 1) - 1);
                    }}
                  />
                </PaginationItem>
              )}

              {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // Show fewer pages on mobile
                  const current = filters.page || 1;
                  if (isMobile) {
                    return (
                      page === 1 || page === data.totalPages || page === current
                    );
                  }
                  // Show current page, first page, last page, and pages around current
                  return (
                    page === 1 ||
                    page === data.totalPages ||
                    (page >= current - 1 && page <= current + 1)
                  );
                })
                .map((page, index, array) => {
                  // Add ellipsis if there's a gap
                  const prevPage = array[index - 1];
                  const showEllipsis = prevPage && page - prevPage > 1;

                  return (
                    <div key={page} className="flex items-center">
                      {showEllipsis && (
                        <PaginationItem>
                          <span className="px-3 py-2">...</span>
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          isActive={page === (filters.page || 1)}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(page);
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    </div>
                  );
                })}

              {(filters.page || 1) < data.totalPages && (
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange((filters.page || 1) + 1);
                    }}
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
```

`components/reviews/reviews-page-content.tsx`

```tsx
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReviewsList } from "./reviews-list";
import { BookingsWithoutReviewsAlerts } from "./bookings-without-reviews-alerts";
import { Star, MessageSquare } from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";

interface ReviewsPageContentProps {
  userId: string;
  userRole?: "customer" | "stylist";
}

export function ReviewsPageContent({
  userId,
  userRole = "customer",
}: ReviewsPageContentProps) {
  const [activeTab, setActiveTab] = useState<string>(
    userRole === "customer" ? "written" : "received"
  );

  if (userRole === "customer") {
    // Customer view: only show reviews they've written
    return (
      <div className="space-y-6">
        <BlurFade delay={0.1} duration={0.5} inView>
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold break-words">
              Mine anmeldelser
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground break-words">
              Anmeldelser jeg har skrevet for stylister jeg har brukt
            </p>
          </div>
        </BlurFade>

        <BlurFade delay={0.15} duration={0.5} inView>
          <BookingsWithoutReviewsAlerts
            userId={userId}
            userRole={userRole}
            className="my-4"
          />
        </BlurFade>

        <BlurFade delay={0.2} duration={0.5} inView>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Mine anmeldelser
              </CardTitle>
              <CardDescription>
                Alle anmeldelser du har skrevet for stylister
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewsList
                userId={userId}
                viewType="customer"
                showFilters={true}
              />
            </CardContent>
          </Card>
        </BlurFade>
      </div>
    );
  }

  // Stylist view: tabs for reviews written vs received
  return (
    <div className="space-y-6">
      <BlurFade delay={0.1} duration={0.5} inView>
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold break-words">
            Anmeldelser
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground break-words hyphens-auto">
            Administrer anmeldelser du har mottatt og skrevet
          </p>
        </div>
      </BlurFade>

      <BlurFade delay={0.12} duration={0.5} inView>
        <BookingsWithoutReviewsAlerts
          userId={userId}
          userRole={userRole}
          className="my-4"
        />
      </BlurFade>

      <BlurFade delay={0.15} duration={0.5} inView>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Mottatt
            </TabsTrigger>
            <TabsTrigger value="written" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Skrevet
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-6">
            <BlurFade delay={0.1} duration={0.5} inView>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Anmeldelser du har mottatt
                  </CardTitle>
                  <CardDescription>
                    Anmeldelser fra kunder som har brukt tjenestene dine
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ReviewsList
                    userId={userId}
                    viewType="stylist"
                    showFilters={true}
                  />
                </CardContent>
              </Card>
            </BlurFade>
          </TabsContent>

          <TabsContent value="written" className="space-y-6">
            <BlurFade delay={0.1} duration={0.5} inView>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Anmeldelser du har skrevet
                  </CardTitle>
                  <CardDescription>
                    Anmeldelser du har skrevet som kunde av andre stylister
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ReviewsList
                    userId={userId}
                    viewType="customer"
                    showFilters={true}
                  />
                </CardContent>
              </Card>
            </BlurFade>
          </TabsContent>
        </Tabs>
      </BlurFade>
    </div>
  );
}
```

`app/profiler/[profileId]/anmeldelser/page.tsx`

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileLayout } from "@/components/profile-layout";
import { ReviewsPageContent } from "@/components/reviews/reviews-page-content";

export default async function AnmeldelserPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const supabase = await createClient();

  // Get current user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Non-owners shouldn't be able to access this subpage
  if (!user || user.id !== profileId) {
    redirect(`/profiler/${profileId}`);
  }

  // Fetch profile data to get user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", profileId)
    .single();

  return (
    <ProfileLayout profileId={profileId} userRole={profile?.role}>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-12">
        <div className="max-w-6xl mx-auto w-full">
          <ReviewsPageContent
            userId={profileId}
            userRole={profile?.role === "stylist" ? "stylist" : "customer"}
          />
        </div>
      </div>
    </ProfileLayout>
  );
}
```
