"use server";

import { createClient } from "@/lib/supabase/server";
import type { DatabaseTables } from "@/types";

export type TodoFilters = {
  search?: string;
  completed?: boolean;
  priority?: "low" | "medium" | "high";
  sortBy?: "newest" | "oldest" | "due_date" | "priority";
  page?: number;
  limit?: number;
};

export async function getTodo(id: string) {
  const supabase = await createClient();
  return await supabase.from("todos").select("*").eq("id", id);
}

export async function deleteTodo(id: string) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (!user || userError) {
    return { error: "User not authenticated", data: null };
  }

  // Verify that the user owns the todo
  const { data: existingTodo, error: todoError } = await supabase
    .from("todos")
    .select("user_id")
    .eq("id", id)
    .single();

  if (todoError || !existingTodo) {
    return { error: "Todo not found", data: null };
  }

  if (existingTodo.user_id !== user.id) {
    return { error: "Not authorized to delete this todo", data: null };
  }

  return await supabase.from("todos").delete().eq("id", id);
}

export async function getTodos(userId: string, options: TodoFilters = {}) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (!user || userError || user.id !== userId) {
    return {
      error: "Unauthorized access",
      data: null,
      total: 0,
      totalPages: 0,
    };
  }

  const {
    page = 1,
    limit = 10,
    search,
    completed,
    priority,
    sortBy = "newest",
  } = options;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Build base query
  let todosQuery = supabase
    .from("todos")
    .select(
      `
      *,
      media(
        id,
        file_path,
        media_type
      )
    `,
    )
    .eq("user_id", userId);

  let countQuery = supabase
    .from("todos")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  // Apply filters
  if (search) {
    todosQuery = todosQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (completed !== undefined) {
    todosQuery = todosQuery.eq("completed", completed);
    countQuery = countQuery.eq("completed", completed);
  }

  if (priority) {
    todosQuery = todosQuery.eq("priority", priority);
    countQuery = countQuery.eq("priority", priority);
  }

  // Apply sorting
  switch (sortBy) {
    case "oldest":
      todosQuery = todosQuery.order("created_at", { ascending: true });
      break;
    case "due_date":
      todosQuery = todosQuery
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      break;
    case "priority":
      todosQuery = todosQuery
        .order("priority", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      break;
    case "newest":
    default:
      todosQuery = todosQuery.order("created_at", { ascending: false });
      break;
  }

  // Apply pagination
  todosQuery = todosQuery.range(from, to);

  const [{ data, error }, { count, error: countError }] = await Promise.all([
    todosQuery,
    countQuery,
  ]);

  if (error) {
    return { error: error.message, data: null, total: 0, totalPages: 0 };
  }

  if (countError) {
    return {
      error: countError.message,
      data: null,
      total: 0,
      totalPages: 0,
    };
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return { data, error: null, total, totalPages, currentPage: page };
}

export async function upsertTodo(todo: DatabaseTables["todos"]["Insert"] & { id?: string }) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (!user || userError) {
    return { error: "User not authenticated", data: null };
  }

  // Set user_id from authenticated user
  const todoData = {
    ...todo,
    user_id: user.id,
  };

  if (todo.id) {
    // Update existing todo - verify ownership first
    const { data: existingTodo, error: existingError } = await supabase
      .from("todos")
      .select("user_id")
      .eq("id", todo.id)
      .single();

    if (existingError || !existingTodo) {
      return { error: "Todo not found", data: null };
    }

    if (existingTodo.user_id !== user.id) {
      return { error: "Not authorized to update this todo", data: null };
    }

    const updateData: DatabaseTables["todos"]["Update"] = {
      title: todoData.title,
      description: todoData.description,
      completed: todoData.completed,
      priority: todoData.priority,
      due_date: todoData.due_date,
    };

    return await supabase
      .from("todos")
      .update(updateData)
      .eq("id", todo.id)
      .select()
      .single();
  } else {
    // Create new todo
    return await supabase.from("todos").insert(todoData).select().single();
  }
}

export async function deleteTodoAttachment(attachmentId: string) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (!user || userError) {
    return { error: "User not authenticated", data: null };
  }

  // Get the attachment and verify ownership through the todo
  const { data: attachment, error: attachmentError } = await supabase
    .from("media")
    .select(
      `
      id,
      todo_id,
      file_path,
      todos!inner(user_id)
    `,
    )
    .eq("id", attachmentId)
    .eq("media_type", "todo_attachment")
    .single();

  if (attachmentError || !attachment) {
    return { error: "Todo attachment not found", data: null };
  }

  // Verify that the user owns the todo
  if (attachment.todos.user_id !== user.id) {
    return { error: "Not authorized to delete this attachment", data: null };
  }

  // Delete the file from storage
  const { error: storageError } = await supabase.storage
    .from("todo_attachments")
    .remove([attachment.file_path]);

  if (storageError) {
    console.error("Failed to delete attachment from storage:", storageError);
    // Continue with database deletion even if storage deletion fails
  }

  // Delete the media record
  const { error: deleteError } = await supabase
    .from("media")
    .delete()
    .eq("id", attachmentId);

  if (deleteError) {
    return { error: deleteError.message, data: null };
  }

  return { error: null, data: { id: attachmentId } };
}
