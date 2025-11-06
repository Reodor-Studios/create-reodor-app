"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getConversations } from "@/server/conversation.actions";
import { ChatHistoryCard } from "@/components/chat/chat-history-card";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MessageSquarePlusIcon } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";

interface ChatHistoryContentProps {
  userId: string;
}

export function ChatHistoryContent({ userId }: ChatHistoryContentProps) {
  const router = useRouter();

  // Fetch all conversations
  const { data: conversationsData, isLoading } = useQuery({
    queryKey: ["chat-history", userId],
    queryFn: async () => {
      const result = await getConversations(userId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    },
    enabled: !!userId,
  });

  const conversations = conversationsData?.data || [];
  const total = conversationsData?.total || 0;

  const handleNewChat = () => {
    router.push("/chat");
  };

  const handleSelectConversation = (conversationId: string) => {
    router.push(`/chat/${conversationId}`);
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "20rem",
          "--sidebar-width-mobile": "20rem",
        } as React.CSSProperties
      }
    >
      <div className="flex w-full">
        <ChatSidebar
          userId={userId}
          currentConversationId={undefined}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
        />

        <SidebarInset className="flex pt-28 md:pt-16 flex-col flex-1 min-w-0">
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-4xl px-4 md:px-6 py-6">
              {/* Header */}
              <BlurFade delay={0.1} duration={0.5} inView>
                <div className="mb-6">
                  <h1 className="text-3xl font-bold">Your Chat History</h1>
                  <p className="text-sm text-muted-foreground mt-2">
                    {total} conversation{total !== 1 ? "s" : ""}
                  </p>
                </div>
              </BlurFade>

              {/* Conversation Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <BlurFade key={i} delay={i * 0.05} duration={0.5} inView>
                      <Skeleton className="h-40 w-full rounded-lg" />
                    </BlurFade>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <BlurFade delay={0.15} duration={0.5} inView>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <MessageSquarePlusIcon className="size-12 mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      No conversations yet
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Start a new chat to begin
                    </p>
                  </div>
                </BlurFade>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {conversations.map((conversation, index) => (
                    <BlurFade
                      key={conversation.id}
                      delay={index * 0.05}
                      duration={0.5}
                      inView
                    >
                      <ChatHistoryCard conversation={conversation} />
                    </BlurFade>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
