"use server";

import { createClient } from "@/lib/supabase/server";
import type { DatabaseTables } from "@/types";
import type { UIMessage } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { Json } from "@/types/database.types";
import { searchConversations as searchConversationsFTS } from "@/lib/supabase/rpc";

// ============================================================================
// Types
// ============================================================================

export type ConversationFilters = {
  search?: string;
  pinned?: boolean;
  sortBy?: "newest" | "oldest";
  page?: number;
  limit?: number;
};

// Omit FTS columns from public-facing types since they're internal implementation details
export type Conversation = Omit<
  DatabaseTables["conversations"]["Row"],
  "fts_weighted"
>;

export type ConversationWithMessages = Conversation & {
  messages: (Omit<DatabaseTables["messages"]["Row"], "fts">)[];
};

// ============================================================================
// Conversation CRUD
// ============================================================================

/**
 * Get all conversations for a user with optional filters
 */
export async function getConversations(
  userId: string,
  options: ConversationFilters = {},
) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError || user.id !== userId) {
    return {
      error: "Unauthorized",
      data: null,
      total: 0,
      totalPages: 0,
      currentPage: 1,
    };
  }

  const {
    search,
    pinned,
    sortBy = "newest",
    page = 1,
    limit = 50,
  } = options;

  // Use full text search if search query is provided
  if (search && search.trim()) {
    const { data: searchResults, error: searchError } =
      await searchConversationsFTS(supabase, userId, search);

    if (searchError) {
      return {
        error: searchError,
        data: null,
        total: 0,
        totalPages: 0,
        currentPage: page,
      };
    }

    // Apply additional filters on FTS results
    let filteredResults = searchResults || [];
    if (pinned !== undefined) {
      filteredResults = filteredResults.filter((c) => c.pinned === pinned);
    }

    // FTS results are already sorted by rank, but apply additional sorting if needed
    if (sortBy === "oldest") {
      filteredResults.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    }

    // Apply pagination
    const total = filteredResults.length;
    const totalPages = Math.ceil(total / limit);
    const from = (page - 1) * limit;
    const to = from + limit;
    const paginatedResults = filteredResults.slice(from, to);

    // Remove rank property from results to match expected type
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const data = paginatedResults.map(({ rank, ...rest }) => rest);

    return {
      error: null,
      data,
      total,
      totalPages,
      currentPage: page,
    };
  }

  // Regular query without search
  // Note: explicitly select columns to exclude FTS columns
  let conversationsQuery = supabase
    .from("conversations")
    .select(
      "id, user_id, title, pinned, preview, created_at, updated_at",
      { count: "exact" },
    )
    .eq("user_id", userId);

  // Apply filters
  if (pinned !== undefined) {
    conversationsQuery = conversationsQuery.eq("pinned", pinned);
  }

  // Apply sorting
  if (sortBy === "newest") {
    conversationsQuery = conversationsQuery.order("updated_at", {
      ascending: false,
    });
  } else if (sortBy === "oldest") {
    conversationsQuery = conversationsQuery.order("created_at", {
      ascending: true,
    });
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  conversationsQuery = conversationsQuery.range(from, to);

  // Execute query
  const { data, error, count } = await conversationsQuery;

  if (error) {
    return {
      error: error.message,
      data: null,
      total: 0,
      totalPages: 0,
      currentPage: page,
    };
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    error: null,
    data,
    total,
    totalPages,
    currentPage: page,
  };
}

/**
 * Get a single conversation with all messages
 */
export async function getConversation(conversationId: string) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return { error: "User not authenticated", data: null };
  }

  // Get conversation with ownership verification
  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id, user_id, title, pinned, preview, created_at, updated_at")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (conversationError || !conversation) {
    return { error: "Conversation not found", data: null };
  }

  // Get all messages for this conversation
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("id, conversation_id, role, parts, metadata, created_at, sequence_number")
    .eq("conversation_id", conversationId)
    .order("sequence_number", { ascending: true });

  if (messagesError) {
    return { error: messagesError.message, data: null };
  }

  return {
    error: null,
    data: {
      ...conversation,
      messages: messages || [],
    } as ConversationWithMessages,
  };
}

/**
 * Create a new conversation
 */
export async function createConversation(
  data: Omit<DatabaseTables["conversations"]["Insert"], "user_id">,
) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return { error: "User not authenticated", data: null };
  }

  const conversationData = {
    ...data,
    user_id: user.id,
  };

  const { data: conversation, error } = await supabase
    .from("conversations")
    .insert(conversationData)
    .select()
    .single();

  if (error) {
    return { error: error.message, data: null };
  }

  return { error: null, data: conversation };
}

/**
 * Update a conversation (title, pinned status, preview)
 */
export async function updateConversation(
  id: string,
  data: DatabaseTables["conversations"]["Update"],
) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return { error: "User not authenticated", data: null };
  }

  // Verify ownership before update
  const { data: existing, error: existingError } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (existingError || !existing) {
    return { error: "Conversation not found or unauthorized", data: null };
  }

  const { data: updated, error } = await supabase
    .from("conversations")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: error.message, data: null };
  }

  return { error: null, data: updated };
}

/**
 * Delete a conversation (cascade will delete messages)
 */
export async function deleteConversation(id: string) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return { error: "User not authenticated", data: null };
  }

  // Verify ownership before delete
  const { data: existing, error: existingError } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (existingError || !existing) {
    return { error: "Conversation not found or unauthorized", data: null };
  }

  const { error } = await supabase.from("conversations").delete().eq("id", id);

  if (error) {
    return { error: error.message, data: null };
  }

  return { error: null, data: { id } };
}

/**
 * Delete all conversations for the current user
 */
export async function deleteAllConversations(userId: string) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError || user.id !== userId) {
    return { error: "Unauthorized", data: null };
  }

  // Delete all conversations for the user (cascade will delete messages)
  const { error, count } = await supabase
    .from("conversations")
    .delete({ count: "exact" })
    .eq("user_id", userId);

  if (error) {
    return { error: error.message, data: null };
  }

  return { error: null, data: { deletedCount: count || 0 } };
}

// ============================================================================
// Message Management
// ============================================================================

/**
 * Save messages to a conversation
 * This is called from the onFinish callback in the API route
 */
export async function saveMessages(
  conversationId: string,
  messages: UIMessage[],
) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return { error: "User not authenticated", data: null };
  }

  // Verify conversation ownership
  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id, user_id")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (conversationError || !conversation) {
    return { error: "Conversation not found or unauthorized", data: null };
  }

  // Get current max sequence number
  const { data: existingMessages, error: existingError } = await supabase
    .from("messages")
    .select("sequence_number")
    .eq("conversation_id", conversationId)
    .order("sequence_number", { ascending: false })
    .limit(1);

  if (existingError) {
    return { error: existingError.message, data: null };
  }

  const startSequence = existingMessages && existingMessages.length > 0
    ? existingMessages[0].sequence_number + 1
    : 0;

  // Convert UIMessages to database format
  const messageRecords = messages.map((message, index) => ({
    conversation_id: conversationId,
    role: message.role as "user" | "assistant" | "system",
    parts: message.parts as unknown as Json,
    metadata: (message.metadata as unknown as Json) || undefined,
    sequence_number: startSequence + index,
  }));

  // Insert messages
  const { data, error } = await supabase
    .from("messages")
    .insert(messageRecords)
    .select();

  if (error) {
    return { error: error.message, data: null };
  }

  // Update conversation's updated_at timestamp and preview
  if (messages.length > 0) {
    const firstUserMessage = messages.find((m) => m.role === "user");
    if (firstUserMessage) {
      const previewText = firstUserMessage.parts
        .filter((p) => p.type === "text")
        .map((p) => ("text" in p ? p.text : ""))
        .join(" ")
        .substring(0, 100) || null;

      await supabase
        .from("conversations")
        .update({
          preview: previewText,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId);
    }
  }

  return { error: null, data };
}

/**
 * Generate a conversation title based on the first user message
 * Uses AI to create a concise 3-4 word title
 */
export async function generateConversationTitle(
  conversationId: string,
  firstUserMessage: string,
) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return { error: "User not authenticated", data: null };
  }

  // Verify conversation ownership
  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id, user_id, title")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (conversationError || !conversation) {
    return { error: "Conversation not found or unauthorized", data: null };
  }

  // Only generate title if it's still "New conversation"
  if (conversation.title !== "New conversation") {
    return { error: null, data: conversation };
  }

  try {
    // Use AI to generate a concise title
    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-5-20250929"),
      prompt:
        `Generate a concise 3-4 word title for a conversation that starts with this user message: "${firstUserMessage}".

      Only return the title, nothing else. No quotes, no punctuation at the end.

      Examples:
      - User message: "How do I install React?" → Title: "React Installation Help"
      - User message: "Explain quantum computing" → Title: "Quantum Computing Explanation"
      - User message: "Write a blog post about AI" → Title: "AI Blog Post Writing"`,
    });

    const title = text.trim();

    // Update conversation with generated title
    const { data: updated, error: updateError } = await supabase
      .from("conversations")
      .update({ title })
      .eq("id", conversationId)
      .select()
      .single();

    if (updateError) {
      return { error: updateError.message, data: null };
    }

    return { error: null, data: updated };
  } catch (error) {
    console.error("Error generating title:", error);

    // Fallback to a simple truncated version of the first message
    const fallbackTitle = firstUserMessage.substring(0, 30) +
      (firstUserMessage.length > 30 ? "..." : "");

    const { data: updated, error: updateError } = await supabase
      .from("conversations")
      .update({ title: fallbackTitle })
      .eq("id", conversationId)
      .select()
      .single();

    if (updateError) {
      return { error: updateError.message, data: null };
    }

    return { error: null, data: updated };
  }
}

// ============================================================================
// File Upload
// ============================================================================

/**
 * Upload a file attachment for a chat message
 */
export async function uploadChatAttachment(
  conversationId: string,
  file: File,
) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return { error: "User not authenticated", data: null };
  }

  // Verify conversation ownership
  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id, user_id")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (conversationError || !conversation) {
    return { error: "Conversation not found or unauthorized", data: null };
  }

  // Generate unique file path
  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}/${conversationId}/${Date.now()}.${fileExt}`;

  // Upload to storage
  const { data: storageData, error: storageError } = await supabase.storage
    .from("chat_attachments")
    .upload(fileName, file);

  if (storageError) {
    return { error: storageError.message, data: null };
  }

  // Create media record
  const { data: media, error: mediaError } = await supabase
    .from("media")
    .insert({
      owner_id: user.id,
      file_path: storageData.path,
      media_type: "chat_attachment",
      conversation_id: conversationId,
    })
    .select()
    .single();

  if (mediaError) {
    // Cleanup uploaded file if media record creation fails
    await supabase.storage.from("chat_attachments").remove([storageData.path]);
    return { error: mediaError.message, data: null };
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("chat_attachments").getPublicUrl(storageData.path);

  return {
    error: null,
    data: {
      ...media,
      publicUrl,
    },
  };
}

/**
 * Delete a chat attachment
 */
export async function deleteChatAttachment(attachmentId: string) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return { error: "User not authenticated", data: null };
  }

  // Get attachment and verify ownership through conversation
  const { data: attachment, error: attachmentError } = await supabase
    .from("media")
    .select(
      `
      id,
      file_path,
      conversation_id,
      conversations!inner(user_id)
    `,
    )
    .eq("id", attachmentId)
    .eq("media_type", "chat_attachment")
    .single();

  if (attachmentError || !attachment) {
    return { error: "Attachment not found", data: null };
  }

  // Type assertion since we know the structure
  const typedAttachment = attachment as unknown as {
    id: string;
    file_path: string;
    conversation_id: string;
    conversations: { user_id: string };
  };

  // Verify ownership
  if (typedAttachment.conversations.user_id !== user.id) {
    return { error: "Unauthorized", data: null };
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from("chat_attachments")
    .remove([typedAttachment.file_path]);

  if (storageError) {
    return { error: storageError.message, data: null };
  }

  // Delete database record
  const { error: deleteError } = await supabase
    .from("media")
    .delete()
    .eq("id", attachmentId);

  if (deleteError) {
    return { error: deleteError.message, data: null };
  }

  return { error: null, data: { id: attachmentId } };
}
