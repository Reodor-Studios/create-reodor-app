"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatEmptyState } from "@/components/chat/chat-empty-state";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessage } from "@/components/chat/chat-message";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { type PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { useState } from "react";
import { MODELS } from "@/types/chat";

interface ChatPageContentProps {
  userId: string;
}

export function ChatPageContent({ userId }: ChatPageContentProps) {
  const [input, setInput] = useState("");
  const [model, setModel] = useState(MODELS[0].id);
  const [webSearch, setWebSearch] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | undefined
  >(undefined);

  const { messages, sendMessage, status, regenerate } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const handleNewChat = () => {
    // Reset to empty state
    setCurrentConversationId(undefined);
    setInput("");
    // In production, this would trigger conversation creation
  };

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    // In production, this would load conversation messages from database
    console.log("Load conversation:", conversationId);
  };

  const handleQuestionSelect = (question: string) => {
    setInput(question);
    // Optionally auto-submit
    // sendMessage(
    //   { text: question },
    //   {
    //     body: { model, webSearch },
    //   }
    // );
  };

  const handleSubmit = (message: PromptInputMessage) => {
    sendMessage(
      {
        text: message.text || "Sent with attachments",
        files: message.files,
      },
      {
        body: {
          model,
          webSearch,
        },
      },
    );
  };

  const showEmptyState = messages.length === 0;

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen w-full">
        <ChatSidebar
          currentConversationId={currentConversationId}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
        />

        <SidebarInset className="flex flex-col">
          {showEmptyState ? (
            <ChatEmptyState onQuestionSelect={handleQuestionSelect} />
          ) : (
            <div className="flex flex-col h-full">
              <Conversation className="flex-1">
                <ConversationContent>
                  {messages.map((message, index) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isLast={index === messages.length - 1}
                      status={status}
                      onRegenerate={regenerate}
                    />
                  ))}

                  {(status === "submitted" || status === "streaming") &&
                    messages.length > 0 &&
                    messages[messages.length - 1].role === "user" && (
                      <Loader />
                    )}
                </ConversationContent>
                <ConversationScrollButton />
              </Conversation>
            </div>
          )}

          <div className="border-t">
            <ChatInput
              input={input}
              onInputChange={setInput}
              onSubmit={handleSubmit}
              model={model}
              onModelChange={setModel}
              webSearch={webSearch}
              onWebSearchChange={setWebSearch}
              status={status}
              disabled={status === "submitted" || status === "streaming"}
            />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
