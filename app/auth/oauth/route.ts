import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error_param = searchParams.get("error");

  console.log("[AUTH_CALLBACK] Received request:", {
    url: request.url,
    code: code ? "present" : "missing",
    error: error_param,
    origin,
  });

  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get("next") ?? "/";

  if (!next.startsWith("/")) {
    // if "next" is not a relative URL, use the default
    next = "/";
  }

  // Check for OAuth error first
  if (error_param) {
    console.log("[AUTH_CALLBACK] OAuth error received:", error_param);
    return NextResponse.redirect(
      `${origin}/auth/error?error=oauth_${error_param}`,
    );
  }

  if (code) {
    console.log("[AUTH_CALLBACK] Attempting code exchange...");
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[AUTH_CALLBACK] Code exchange failed:", error);
      return NextResponse.redirect(
        `${origin}/auth/error?error=oauth_exchange_failed`,
      );
    }

    if (data?.user) {
      console.log(
        "[AUTH_CALLBACK] Code exchange successful for user:",
        data.user.id,
      );

      // Process Google profile picture if available
      await processGoogleProfilePicture(data.user);

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  console.log("[AUTH_CALLBACK] No code provided or exchange failed");
  // return the user to an error page with instructions
  return NextResponse.redirect(
    `${origin}/auth/error?error=oauth_callback_failed`,
  );
}

async function processGoogleProfilePicture(user: User) {
  try {
    // Check if user has a Google profile picture
    const avatarUrl = user.user_metadata?.avatar_url ||
      user.user_metadata?.picture;

    if (!avatarUrl || !avatarUrl.includes("googleusercontent.com")) {
      console.log("[GOOGLE_AVATAR] No Google profile picture found");
      return;
    }

    console.log(
      "[GOOGLE_AVATAR] Processing Google profile picture for user:",
      user.id,
    );

    const supabase = await createClient();

    // Check if user already has an avatar in our system
    const { data: existingMedia } = await supabase
      .from("media")
      .select("id")
      .eq("owner_id", user.id)
      .eq("media_type", "avatar")
      .single();

    if (existingMedia) {
      console.log("[GOOGLE_AVATAR] User already has avatar, skipping");
      return;
    }

    // Download the Google profile picture
    const response = await fetch(avatarUrl);
    if (!response.ok) {
      console.error("[GOOGLE_AVATAR] Failed to fetch Google profile picture");
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a File object from the buffer
    const filename = `google-avatar-${Date.now()}.jpg`;
    const file = new File([buffer], filename, { type: "image/jpeg" });

    // Generate storage path for avatar
    const storagePath = `${user.id}/${filename}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(storagePath, file, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("[GOOGLE_AVATAR] Upload failed:", uploadError);
      return;
    }

    // Create media record
    const { error: mediaError } = await supabase
      .from("media")
      .insert({
        owner_id: user.id,
        file_path: storagePath,
        media_type: "avatar",
      });

    if (mediaError) {
      console.error(
        "[GOOGLE_AVATAR] Failed to create media record:",
        mediaError,
      );
      // Clean up uploaded file if database insert fails
      await supabase.storage.from("avatars").remove([storagePath]);
      return;
    }

    console.log("[GOOGLE_AVATAR] Successfully imported Google profile picture");
  } catch (error) {
    console.error("[GOOGLE_AVATAR] Error processing profile picture:", error);
  }
}
