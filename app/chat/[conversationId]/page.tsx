import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatPageContent } from "@/components/chat/chat-page-content";

export const metadata = {
  title: "Chat | AI Assistant",
  description: "Snakk med AI-assistenten din",
};

interface ChatPageProps {
  params: Promise<{
    conversationId: string;
  }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const supabase = await createClient();

  // Server-side authentication check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect("/auth/login");
  }

  const { conversationId } = await params;

  return <ChatPageContent userId={user.id} conversationId={conversationId} />;
}
