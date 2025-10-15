"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { ContactFormData } from "@/types";
import { sendEmail } from "@/lib/resend-utils";
import ContactFormEmail from "@/transactional/emails/contact-form-email";

export async function submitContactForm(
  { name, email, subject, message }: ContactFormData,
) {
  try {
    const supabase = createServiceClient();

    // Get all admin profiles
    const { data: admins, error: adminError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("role", "admin")
      .not("email", "is", null);

    if (adminError) {
      console.error("Error fetching administrators:", adminError);
      return { error: "Kunne ikke sende melding", data: null };
    }

    if (!admins || admins.length === 0) {
      console.error("No administrators found");
      return { error: "Kunne ikke sende melding", data: null };
    }

    // Send email to all administrators
    const emailPromises = admins.map((admin) =>
      sendEmail({
        to: [admin.email!],
        subject: `Ny henvendelse: ${subject}`,
        react: ContactFormEmail({
          name,
          email,
          subject,
          message,
          adminName: admin.full_name || "Administrator",
        }),
      })
    );

    const results = await Promise.all(emailPromises);

    // Check if any emails failed
    const failures = results.filter((result) => result.error);
    if (failures.length > 0) {
      console.error("Some emails failed to send:", failures);
      return { error: "Kunne ikke sende melding", data: null };
    }

    return { error: null, data: { success: true } };
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return { error: "Kunne ikke sende melding", data: null };
  }
}
