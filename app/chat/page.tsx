import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatPageContent } from "@/components/chat/chat-page-content";

export const metadata = {
  title: "Chat | AI Assistant",
  description: "Snakk med AI-assistenten din",
};

export default async function ChatPage() {
  const supabase = await createClient();

  // Server-side authentication check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ChatPageContent userId={user.id} />
    </div>
  );
}
