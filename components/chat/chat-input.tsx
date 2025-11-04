"use client";

import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { MODELS } from "@/types/chat";
import { GlobeIcon } from "lucide-react";
import { toast } from "sonner";

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (message: PromptInputMessage) => void;
  model: string;
  onModelChange: (model: string) => void;
  webSearch: boolean;
  onWebSearchChange: (enabled: boolean) => void;
  status: "submitted" | "streaming" | "ready" | "error";
  disabled?: boolean;
}

export function ChatInput({
  input,
  onInputChange,
  onSubmit,
  model,
  onModelChange,
  webSearch,
  onWebSearchChange,
  status,
  disabled = false,
}: ChatInputProps) {
  const handleWebSearchToggle = () => {
    const newValue = !webSearch;
    onWebSearchChange(newValue);

    if (newValue) {
      toast.info("Web search enabled", {
        description:
          "Responses will include sources from the web. Full Perplexity Sonar integration coming soon!",
      });
    }
  };

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    onSubmit(message);
    onInputChange("");
  };

  return (
    <PromptInput
      onSubmit={handleSubmit}
      globalDrop
      multiple
      className="border-t"
    >
      <PromptInputHeader>
        <PromptInputAttachments>
          {(attachment) => <PromptInputAttachment data={attachment} />}
        </PromptInputAttachments>
      </PromptInputHeader>

      <PromptInputBody>
        <PromptInputTextarea
          onChange={(e) => onInputChange(e.target.value)}
          value={input}
          placeholder="Type your message..."
          disabled={disabled}
        />
      </PromptInputBody>

      <PromptInputFooter>
        <PromptInputTools>
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger />
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>

          <PromptInputButton
            variant={webSearch ? "default" : "ghost"}
            onClick={handleWebSearchToggle}
            disabled={disabled}
          >
            <GlobeIcon className="size-4" />
            <span>Search</span>
          </PromptInputButton>

          <PromptInputModelSelect
            onValueChange={onModelChange}
            value={model}
            disabled={disabled}
          >
            <PromptInputModelSelectTrigger>
              <PromptInputModelSelectValue />
            </PromptInputModelSelectTrigger>
            <PromptInputModelSelectContent>
              {MODELS.map((model) => (
                <PromptInputModelSelectItem key={model.id} value={model.id}>
                  {model.name}
                </PromptInputModelSelectItem>
              ))}
            </PromptInputModelSelectContent>
          </PromptInputModelSelect>
        </PromptInputTools>

        <PromptInputSubmit disabled={!input && !status} status={status} />
      </PromptInputFooter>
    </PromptInput>
  );
}
