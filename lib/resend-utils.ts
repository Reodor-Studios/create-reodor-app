// Ensure this file is server-only
import "server-only";

import { resend } from "@/lib/resend";
import type { ReactElement } from "react";
import { env } from "@/env";

interface SendEmailOptions {
  to: string[];
  subject: string;
  react: ReactElement;
  sendAdminCopy?: boolean;
}

/**
 * Send email with environment-aware configuration
 * 
 * In development:
 * - Uses DEV_EMAIL_FROM for from address
 * - Uses DEV_EMAIL_TO for to address
 * 
 * In production:
 * - Uses PROD_EMAIL_FROM for from address
 * - Uses actual recipient emails from the to parameter
 *
 * @param options - Email options with to, subject, react content, and optional admin copy
 * @returns Promise<{error: string | null}>
 */
export async function sendEmail({ to, subject, react, sendAdminCopy = false }: SendEmailOptions): Promise<{error: string | null}> {
  const isDevelopment = process.env.NODE_ENV === "development";

  const fromAddress = isDevelopment
    ? env.DEV_EMAIL_FROM
    : env.PROD_EMAIL_FROM;

  const toAddresses = isDevelopment
    ? [env.DEV_EMAIL_TO]
    : to;

  // Add admin email if requested and available
  const finalToAddresses = [...toAddresses];
  if (sendAdminCopy && env.ADMIN_EMAIL && !isDevelopment) {
    // Only add admin email in production and if it's defined
    finalToAddresses.push(env.ADMIN_EMAIL);
  }

  if (!fromAddress) {
    throw new Error("From address is not set");
  }

  if (!finalToAddresses || finalToAddresses.length === 0) {
    throw new Error("To addresses are not set");
  }

  try {
    const { error } = await resend.emails.send({
      from: fromAddress,
      to: finalToAddresses,
      subject,
      react,
    });

    if (error) {
      console.error("[RESEND_UTILS] Email send error:", error);
      return { error: error.message || "Failed to send email" };
    }

    console.log(`[RESEND_UTILS] Email sent successfully to:\n${finalToAddresses.map(address => `- ${address}`).join("\n")}\n(from: ${fromAddress})`);
    if (sendAdminCopy && env.ADMIN_EMAIL && !isDevelopment) {
      console.log(`[RESEND_UTILS] Admin copy sent to: ${env.ADMIN_EMAIL}`);
    }
    return { error: null };

  } catch (error) {
    console.error("[RESEND_UTILS] Unexpected error sending email:", error);
    return { 
      error: error instanceof Error ? error.message : "Unexpected error sending email" 
    };
  }
}