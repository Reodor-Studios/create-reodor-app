"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { submitContactForm } from "@/server/contact.actions";
import { ContactFormData } from "@/types";
import { Spinner } from "./ui/spinner";

export const ContactForm = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const mutation = useMutation({
    mutationFn: submitContactForm,
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Takk for din melding! Vi tar kontakt snart.");
        setFormData({ name: "", email: "", subject: "", message: "" });
      }
    },
    onError: () => {
      toast.error("Noe gikk galt. Vennligst prøv igjen.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isSubmitting = mutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Navn *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Ditt navn"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-post *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="din@email.no"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Emne *</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) => handleInputChange("subject", e.target.value)}
          placeholder="Hva gjelder henvendelsen?"
          required
        />
      </div>

      <div className="space-y-2 flex-1 flex flex-col">
        <Label htmlFor="message">Melding *</Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => handleInputChange("message", e.target.value)}
          placeholder="Skriv din melding her..."
          className="flex-1 resize-none"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Spinner className="w-4 h-4 mr-2" />
            Sender...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Send melding
          </>
        )}
      </Button>
    </form>
  );
};
