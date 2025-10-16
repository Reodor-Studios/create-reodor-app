import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { sendWelcomeEmail } from "@/server/auth.actions";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();

    const { error, data } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // Check if this is a new user (just confirmed their email)
      if (data.user && data.user.email_confirmed_at) {
        // Get user profile to check if welcome email should be sent
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, role, created_at")
          .eq("id", data.user.id)
          .single();

        if (profileError) {
          console.error("Error getting profile:", profileError);
        }

        if (!profile || !data.user.email) {
          redirect(next);
        }

        // Only send welcome email if the account was recently created (within last hour to handle verification delays)
        const accountAge = Date.now() - new Date(profile.created_at).getTime();
        const oneHourMs = 60 * 60 * 1000;

        if (accountAge < oneHourMs) {
          // Send welcome email asynchronously (don't wait for it)
          await sendWelcomeEmail({
            email: data.user.email,
            userName: profile.full_name || undefined,
            userId: data.user.id,
          }).catch((error) => {
            console.error(
              "[AUTH_CONFIRM] Failed to send welcome email:",
              error,
            );
          });
        }
      } else {
        console.log("User email not confirmed or missing user data");
      }

      // redirect user to specified redirect URL or root of app
      redirect(next);
    } else {
      console.error("[AUTH_CONFIRM] OTP verification failed:", error.message);
      // redirect the user to an error page with some instructions
      redirect(`/auth/error?error=${error?.message}`);
    }
  }

  console.log(
    "[AUTH_CONFIRM] Missing token hash or type, redirecting to error",
  );
  // redirect the user to an error page with some instructions
  redirect(`/auth/error?error=No token hash or type`);
}
