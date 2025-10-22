"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/resend-utils";
import { WelcomeEmail } from "@/transactional/emails/welcome";
import { AccountDeletionConfirmationEmail } from "@/transactional/emails/account-deletion-confirmation";
import { AccountDeletedNotificationEmail } from "@/transactional/emails/account-deleted-notification";
import { jwtVerify, SignJWT } from "jose";
import { companyConfig } from "@/lib/brand";
import { env } from "@/env";

export async function checkUserExists(email: string) {
  try {
    const supabase = await createClient();

    // Query the profiles table directly by email
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("Error checking user exists:", error);
      return { error: "Kunne ikke sjekke bruker", exists: false };
    }

    return { exists: !!data, error: null };
  } catch (error) {
    console.error("Error checking user exists:", error);
    return { error: "En feil oppstod ved sjekk av bruker", exists: false };
  }
}

export async function sendWelcomeEmail({
  email,
  userName,
  userId,
}: {
  email: string;
  userName?: string;
  userId: string;
}) {
  try {
    const { error} = await sendEmail({
      to: [email],
      subject: `Velkommen til ${companyConfig.name}`,
      react: WelcomeEmail({
        userName: userName || "Kjære kunde",
        userId: userId,
      }),
    });

    if (error) {
      console.error("[WELCOME_EMAIL] Failed to send welcome email:", error);
      return { error: "Failed to send welcome email", success: false };
    }

    return { success: true };
  } catch (error) {
    console.error("[WELCOME_EMAIL] Error sending welcome email:", error);
    return {
      error: "An error occurred while sending welcome email",
      success: false,
    };
  }
}

async function generateAccountDeletionToken(userId: string): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_SECRET);

  const token = await new SignJWT({
    userId,
    purpose: "account-deletion",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);

  return token;
}

export async function verifyAccountDeletionToken({
  token,
  userId,
}: {
  token: string;
  userId: string;
}) {
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);

    const { payload } = await jwtVerify(token, secret);

    // Validate token purpose and user ID
    if (payload.purpose !== "account-deletion" || payload.userId !== userId) {
      console.error("[VERIFY_DELETE_TOKEN] Invalid token purpose or user ID", {
        purpose: payload.purpose,
        tokenUserId: payload.userId,
        expectedUserId: userId,
      });
      return {
        valid: false,
        error:
          "Ugyldig token. Denne lenken er ikke gyldig for sletting av konto.",
      };
    }

    // Check expiration (JWT library handles this, but let's be explicit)
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === "number" && payload.exp < now) {
      console.error("[VERIFY_DELETE_TOKEN] Token expired", {
        exp: payload.exp,
        now: now,
        expiresAt: new Date(payload.exp * 1000),
      });
      return {
        valid: false,
        error:
          "Utløpt lenke. Denne lenken er ikke lenger gyldig. Vennligst be om en ny lenke.",
      };
    }

    return {
      valid: true,
      payload: {
        userId: payload.userId as string,
        purpose: payload.purpose as string,
        exp: payload.exp as number,
        iat: payload.iat as number,
      },
    };
  } catch (error) {
    console.error("[VERIFY_DELETE_TOKEN] Token verification failed:", error);
    return {
      valid: false,
      error:
        "Ugyldig eller utløpt lenke. Vennligst be om en ny lenke fra din profil.",
    };
  }
}

export async function sendAccountDeletionConfirmationEmail({
  userId,
}: {
  userId: string;
}) {
  try {
    const supabase = await createClient();

    // Get user profile information
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .single();

    if (profileError || !profile?.email) {
      console.error(
        "[DELETE_ACCOUNT] Failed to get user profile:",
        profileError,
      );
      return { error: "Kunne ikke finne brukerprofil", success: false };
    }

    // Generate deletion confirmation token
    const confirmationToken = await generateAccountDeletionToken(userId);

    const { error } = await sendEmail({
      to: [profile.email],
      subject: `Bekreft sletting av konto - ${companyConfig.name}`,
      react: AccountDeletionConfirmationEmail({
        userName: profile.full_name || "Kjære kunde",
        userId: userId,
        confirmationToken: confirmationToken,
      }),
    });

    if (error) {
      console.error(
        "[DELETE_ACCOUNT] Failed to send deletion confirmation email:",
        error,
      );
      return { error: "Failed to send confirmation email", success: false };
    }

    console.log(
      "[DELETE_ACCOUNT] Deletion confirmation email sent successfully:",
      {
        recipient: profile.email,
      },
    );
    return { success: true };
  } catch (error) {
    console.error(
      "[DELETE_ACCOUNT] Error sending deletion confirmation email:",
      error,
    );
    return {
      error: "An error occurred while sending confirmation email",
      success: false,
    };
  }
}

export async function deleteUserAccount({
  token,
  userId,
}: {
  token: string;
  userId: string;
}) {
  try {
    // First, verify the token again for security
    const tokenVerification = await verifyAccountDeletionToken({
      token,
      userId,
    });
    if (!tokenVerification.valid) {
      console.error(
        "[DELETE_USER] Token verification failed:",
        tokenVerification.error,
      );
      return {
        success: false,
        error: tokenVerification.error,
        redirectTo: "/auth/delete-account/error?reason=token_invalid",
      };
    }

    // Get user profile information before deletion for the notification email
    const supabase = await createClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .single();

    if (profileError || !profile?.email) {
      console.error(
        "[DELETE_USER] Failed to get user profile before deletion:",
        profileError,
      );
      return {
        success: false,
        error: "Kunne ikke finne brukerinformasjon",
        redirectTo: "/auth/delete-account/error?reason=user_not_found",
      };
    }

    const userEmail = profile.email;
    const userName = profile.full_name || undefined;

    // Use service client to delete the user (bypasses RLS and handles cascading)
    const serviceClient = createServiceClient();

    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(
      userId,
    );

    if (deleteError) {
      console.error(
        "[DELETE_USER] Failed to delete user from auth:",
        deleteError,
      );
      return {
        success: false,
        error: "Teknisk feil ved sletting av konto",
        redirectTo:
          "/auth/delete-account/error?reason=deletion_failed&message=" +
          encodeURIComponent(deleteError.message),
      };
    }

    console.log(
      "[DELETE_USER] User deleted from auth.users, cascade deletion should handle related data",
    );

    // Send account deleted notification email
    try {
      await sendAccountDeletedNotificationEmail({
        userEmail,
        userName,
      });
      console.log(
        "[DELETE_USER] Account deleted notification email sent successfully",
      );
    } catch (emailError) {
      console.error(
        "[DELETE_USER] Failed to send notification email, but deletion was successful:",
        emailError,
      );
      // Don't fail the deletion if email fails - account is already deleted
    }

    return {
      success: true,
      redirectTo: "/auth/delete-account/success",
    };
  } catch (error) {
    console.error(
      "[DELETE_USER] Unexpected error during account deletion:",
      error,
    );
    return {
      success: false,
      error: "En uventet feil oppstod under sletting av kontoen",
      redirectTo: "/auth/delete-account/error?reason=deletion_failed&message=" +
        encodeURIComponent(
          error instanceof Error ? error.message : "Unknown error",
        ),
    };
  }
}

async function sendAccountDeletedNotificationEmail({
  userEmail,
  userName,
}: {
  userEmail: string;
  userName?: string;
}) {
  console.log(
    "[DELETE_NOTIFICATION] Sending account deleted notification email",
    {
      email: userEmail,
      userName,
    },
  );

  const { error } = await sendEmail({
    to: [userEmail],
    subject: `Konto slettet - ${companyConfig.name}`,
    react: AccountDeletedNotificationEmail({
      userName: userName || "Kjære tidligere kunde",
      userEmail: userEmail,
    }),
  });

  if (error) {
    console.error(
      "[DELETE_NOTIFICATION] Failed to send notification email:",
      error,
    );
    throw new Error("Failed to send notification email: " + error);
  }

  console.log(
    "[DELETE_NOTIFICATION] Account deleted notification email sent successfully:",
    {
      recipient: userEmail,
    },
  );
}
