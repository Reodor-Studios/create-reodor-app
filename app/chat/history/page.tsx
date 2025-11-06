import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatHistoryContent } from "@/components/chat/chat-history-content";

export default async function ChatHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <ChatHistoryContent userId={user.id} />;
}
