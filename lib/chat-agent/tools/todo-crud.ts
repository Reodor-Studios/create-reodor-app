import { tool } from "ai";
import { z } from "zod";
import {
  deleteTodo,
  getTodo,
  getTodos,
  type TodoFilters,
  upsertTodo,
} from "@/server/todo.actions";
import type { DatabaseTables } from "@/types";

/**
 * Confirmation request type for actions that need user approval
 */
export type ConfirmationRequest = {
  requiresConfirmation: true;
  action: {
    type: "create_todo" | "update_todo" | "delete_todo" | "list_todos";
    description: string;
    details: Record<string, any>;
    impact: string;
    data?: any; // The actual data to be used when confirmed
  };
};

/**
 * Standard tool response that might need confirmation
 */
export type ToolResponse<T> = T | ConfirmationRequest;

/**
 * Helper to create a confirmation request
 */
function createConfirmationRequest(
  type: ConfirmationRequest["action"]["type"],
  description: string,
  details: Record<string, any>,
  impact: string,
  data?: any,
): ConfirmationRequest {
  return {
    requiresConfirmation: true,
    action: {
      type,
      description,
      details,
      impact,
      data,
    },
  };
}

/**
 * List todos with advanced filtering
 */
export const listTodos = tool({
  description: `List and search todos with advanced filtering options.
  Use this to help users find, organize, and analyze their todos.
  Supports search, filtering by completion status, priority, and sorting.`,
  inputSchema: z.object({
    userId: z.string().describe("The user ID to fetch todos for"),
    search: z.string().optional().describe("Search term for title/description"),
    completed: z.boolean().optional().describe("Filter by completion status"),
    priority: z
      .enum(["low", "medium", "high"])
      .optional()
      .describe("Filter by priority level"),
    sortBy: z
      .enum(["newest", "oldest", "due_date", "priority"])
      .optional()
      .describe("Sort order"),
    page: z.number().default(1).describe("Page number for pagination"),
    limit: z.number().default(10).describe("Items per page"),
  }),
  execute: async ({ userId, ...filters }) => {
    const result = await getTodos(userId, filters);

    if (result.error) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      todos: result.data,
      total: result.total,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
    };
  },
});

/**
 * Get a single todo by ID
 */
export const getSingleTodo = tool({
  description: "Get detailed information about a specific todo by its ID",
  inputSchema: z.object({
    todoId: z.string().describe("The ID of the todo to retrieve"),
  }),
  execute: async ({ todoId }) => {
    const result = await getTodo(todoId);

    if (result.error) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      todo: result.data,
    };
  },
});

/**
 * Create a new todo (requires confirmation)
 */
export const createTodo = tool({
  description: `Create a new todo item. This action requires user confirmation.
  Use this when the user explicitly wants to create a todo.
  Before calling this, ensure you understand what todo they want to create.`,
  inputSchema: z.object({
    userId: z.string().describe("The user ID creating the todo"),
    title: z.string().describe("The todo title"),
    description: z.string().optional().describe("Optional description"),
    priority: z
      .enum(["low", "medium", "high"])
      .optional()
      .describe("Priority level"),
    dueDate: z.string().optional().describe("Due date in ISO format"),
    needsConfirmation: z
      .boolean()
      .default(true)
      .describe("Whether this action needs user confirmation"),
  }),
  execute: async ({
    userId,
    title,
    description,
    priority,
    dueDate,
    needsConfirmation,
  }) => {
    const todoData: DatabaseTables["todos"]["Insert"] = {
      user_id: userId,
      title,
      description: description || null,
      priority: priority || null,
      due_date: dueDate || null,
      completed: false,
    };

    // If confirmation is needed, return confirmation request
    if (needsConfirmation) {
      return createConfirmationRequest(
        "create_todo",
        `Create a new todo: "${title}"`,
        {
          title,
          description: description || "No description",
          priority: priority || "Not set",
          dueDate: dueDate || "No due date",
        },
        "This will create a new todo item in your list.",
        todoData,
      );
    }

    // Execute the action
    const result = await upsertTodo(todoData);

    if (result.error) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      message: `Successfully created todo: "${title}"`,
      todo: result.data,
    };
  },
});

/**
 * Update an existing todo (requires confirmation)
 */
export const updateTodo = tool({
  description:
    `Update an existing todo item. This action requires user confirmation.
  Use this when the user wants to modify a todo's details, mark it complete/incomplete, or change its priority.`,
  inputSchema: z.object({
    userId: z.string().describe("The user ID updating the todo"),
    todoId: z.string().describe("The ID of the todo to update"),
    title: z.string().optional().describe("Updated title"),
    description: z.string().optional().describe("Updated description"),
    completed: z.boolean().optional().describe("Completion status"),
    priority: z
      .enum(["low", "medium", "high"])
      .optional()
      .describe("Updated priority"),
    dueDate: z.string().optional().describe("Updated due date in ISO format"),
    needsConfirmation: z
      .boolean()
      .default(true)
      .describe("Whether this action needs user confirmation"),
  }),
  execute: async ({
    userId,
    todoId,
    title,
    description,
    completed,
    priority,
    dueDate,
    needsConfirmation,
  }) => {
    // First get the existing todo to show what's changing
    const existingResult = await getTodo(todoId);
    if (existingResult.error || !existingResult.data) {
      return {
        success: false,
        error: "Todo not found",
      };
    }

    const existing = existingResult.data[0];
    const updates: DatabaseTables["todos"]["Update"] = {
      title: title !== undefined ? title : existing.title,
      description: description !== undefined
        ? description
        : existing.description,
      completed: completed !== undefined ? completed : existing.completed,
      priority: priority !== undefined ? priority : existing.priority,
      due_date: dueDate !== undefined ? dueDate : existing.due_date,
    };

    const todoData: DatabaseTables["todos"]["Insert"] & { id: string } = {
      id: todoId,
      user_id: userId,
      ...updates,
    };

    // If confirmation is needed, return confirmation request
    if (needsConfirmation) {
      const changes: Record<string, { from: any; to: any }> = {};
      if (title !== undefined && title !== existing.title) {
        changes.title = { from: existing.title, to: title };
      }
      if (description !== undefined && description !== existing.description) {
        changes.description = { from: existing.description, to: description };
      }
      if (completed !== undefined && completed !== existing.completed) {
        changes.completed = { from: existing.completed, to: completed };
      }
      if (priority !== undefined && priority !== existing.priority) {
        changes.priority = { from: existing.priority, to: priority };
      }
      if (dueDate !== undefined && dueDate !== existing.due_date) {
        changes.dueDate = { from: existing.due_date, to: dueDate };
      }

      return createConfirmationRequest(
        "update_todo",
        `Update todo: "${existing.title}"`,
        {
          todoId,
          currentTitle: existing.title,
          changes,
        },
        `This will update ${Object.keys(changes).length} field(s) of the todo.`,
        todoData,
      );
    }

    // Execute the action
    const result = await upsertTodo(todoData);

    if (result.error) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      message: `Successfully updated todo: "${updates.title}"`,
      todo: result.data,
    };
  },
});

/**
 * Delete a todo (requires confirmation)
 */
export const deleteTodoTool = tool({
  description:
    `Delete a todo item permanently. This action requires user confirmation.
  Use this when the user explicitly wants to remove a todo from their list.`,
  inputSchema: z.object({
    todoId: z.string().describe("The ID of the todo to delete"),
    needsConfirmation: z
      .boolean()
      .default(true)
      .describe("Whether this action needs user confirmation"),
  }),
  execute: async ({ todoId, needsConfirmation }) => {
    // First get the todo to show what will be deleted
    const existingResult = await getTodo(todoId);
    if (existingResult.error || !existingResult.data) {
      return {
        success: false,
        error: "Todo not found",
      };
    }

    const existing = existingResult.data[0];

    // If confirmation is needed, return confirmation request
    if (needsConfirmation) {
      return createConfirmationRequest(
        "delete_todo",
        `Delete todo: "${existing.title}"`,
        {
          todoId,
          title: existing.title,
          description: existing.description,
          completed: existing.completed,
        },
        "This action cannot be undone. The todo will be permanently deleted.",
        { todoId },
      );
    }

    // Execute the action
    const result = await deleteTodo(todoId);

    if (result.error) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      message: `Successfully deleted todo: "${existing.title}"`,
    };
  },
});

/**
 * Bulk update todos (requires confirmation)
 */
export const bulkUpdateTodos = tool({
  description:
    `Update multiple todos at once (e.g., mark all as complete, change priority for several items).
  This action requires user confirmation and shows the impact of the bulk operation.`,
  inputSchema: z.object({
    userId: z.string().describe("The user ID performing the bulk update"),
    todoIds: z.array(z.string()).describe("Array of todo IDs to update"),
    updates: z.object({
      completed: z.boolean().optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
    }),
    needsConfirmation: z
      .boolean()
      .default(true)
      .describe("Whether this action needs user confirmation"),
  }),
  execute: async ({ userId, todoIds, updates, needsConfirmation }) => {
    // Get all todos to show what will change
    const todosToUpdate = await Promise.all(
      todoIds.map((id) => getTodo(id)),
    );

    const validTodos = todosToUpdate
      .filter((result) => !result.error && result.data)
      .map((result) => result.data![0]);

    if (validTodos.length === 0) {
      return {
        success: false,
        error: "No valid todos found",
      };
    }

    // If confirmation is needed, return confirmation request
    if (needsConfirmation) {
      return createConfirmationRequest(
        "update_todo",
        `Bulk update ${validTodos.length} todo(s)`,
        {
          count: validTodos.length,
          todos: validTodos.map((t) => ({
            id: t.id,
            title: t.title,
            current: {
              completed: t.completed,
              priority: t.priority,
            },
          })),
          updates,
        },
        `This will update ${validTodos.length} todo(s) with the specified changes.`,
        { userId, todoIds, updates },
      );
    }

    // Execute the bulk update
    const results = await Promise.all(
      validTodos.map((todo) =>
        upsertTodo({
          id: todo.id,
          user_id: userId,
          title: todo.title,
          description: todo.description,
          completed: updates.completed ?? todo.completed,
          priority: updates.priority ?? todo.priority,
          due_date: todo.due_date,
        })
      ),
    );

    const successful = results.filter((r) => !r.error).length;
    const failed = results.filter((r) => r.error).length;

    return {
      success: true,
      message:
        `Bulk update complete: ${successful} successful, ${failed} failed`,
      successful,
      failed,
    };
  },
});
