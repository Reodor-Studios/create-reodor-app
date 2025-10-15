import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const useCurrentUserImage = () => {
  return useQuery({
    queryKey: ["user", "avatar"],
    queryFn: async () => {
      const supabase = createClient();

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth
        .getUser();
      if (userError || !user) {
        console.error("Error getting user:", userError);
        return null;
      }

      // Get avatar from media table
      const { data: mediaData, error: mediaError } = await supabase
        .from("media")
        .select("file_path")
        .eq("owner_id", user.id)
        .eq("media_type", "avatar")
        .single();

      if (mediaError && mediaError.code !== "PGRST116") {
        console.error("Error fetching avatar:", mediaError);
        return null;
      } else if (mediaData) {
        // Get public URL for the avatar
        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(mediaData.file_path);

        return urlData.publicUrl;
      } else {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};
