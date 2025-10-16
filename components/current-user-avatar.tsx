"use client";

import { useCurrentUserImage } from "@/hooks/use-current-user-image";
import { useCurrentUserName } from "@/hooks/use-current-user-name";
import { useUploadAvatar } from "@/hooks/use-upload-avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import imageCompression from "browser-image-compression";
import { Spinner } from "./ui/spinner";

interface CurrentUserAvatarProps {
  className?: string;
  isEditing?: boolean;
}

export const CurrentUserAvatar = ({
  className,
  isEditing = false,
}: CurrentUserAvatarProps) => {
  const avatarQuery = useCurrentUserImage();
  const image = avatarQuery.data;
  const isLoading = avatarQuery.isLoading;
  const name = useCurrentUserName();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const uploadAvatarMutation = useUploadAvatar();
  const isUploading = uploadAvatarMutation.isUploading;

  const initials = name
    ?.split(" ")
    ?.filter((_, index, array) => index === 0 || index === array.length - 1)
    ?.map((word) => word[0])
    ?.join("")
    ?.toUpperCase();

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Kun JPEG, PNG og WebP filer er tillatt");
      return;
    }

    setIsCompressing(true);

    try {
      // Get current user
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error("Du må være logget inn for å opplaste et profilbilde");
        setIsCompressing(false);
        return;
      }

      // Compress the image
      const compressionOptions = {
        maxSizeMB: 2,
        maxWidthOrHeight: 400,
        useWebWorker: true,
        fileType: "image/jpeg",
        quality: 0.8,
      };

      const compressedFile = await imageCompression(file, compressionOptions);

      setIsCompressing(false);

      // Call mutation without overriding callbacks - this preserves query invalidation
      uploadAvatarMutation.mutate({ userId: user.id, file: compressedFile });
    } catch (error) {
      setIsCompressing(false);
      toast.error("Feil ved behandling av bildet");
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative inline-block">
      <Avatar className={className}>
        {!isLoading && image && <AvatarImage src={image} alt={initials} />}
        <AvatarFallback>
          {isLoading ? <Spinner className="h-4 w-4" /> : initials}
        </AvatarFallback>
      </Avatar>

      {isEditing && (
        <>
          <Button
            size="sm"
            variant="secondary"
            className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full p-0 shadow-md"
            onClick={handleUploadClick}
            disabled={isUploading || isCompressing}
          >
            {isCompressing || isUploading ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </>
      )}
    </div>
  );
};
