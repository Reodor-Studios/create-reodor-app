import { tool } from "ai";
import { z } from "zod";
import {
  bulkInsertTodos as bulkInsertTodosAction,
  deleteTodo as deleteTodoAction,
  getTodo as getTodoAction,
  getTodos as getTodosAction,
  type TodoFilters,
  upsertTodo as upsertTodoAction,
} from "@/server/todo.actions";
import type { DatabaseTables } from "@/types";

/**
 * Confirmation request type for actions that need user approval
 */
export type ConfirmationRequest = {
  requiresConfirmation: true;
  action: {
    type:
      | "create_todo"
      | "update_todo"
      | "delete_todo"
      | "list_todos"
      | "bulk_insert_todos";
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

export type TodoCrudToolsConfig = {
  userId: string;
};

/**
 * Create todo CRUD tools for a specific user
 * These tools have the userId baked in from the configuration
 */
export function createTodoCrudTools({ userId }: TodoCrudToolsConfig) {
  /**
   * List todos with advanced filtering
   */
  const listTodos = tool({
    description: `List and search todos with advanced filtering options.
    Use this to help users find, organize, and analyze their todos.
    Supports search, filtering by completion status, priority, and sorting.`,
    inputSchema: z.object({
      search: z.string().optional().describe(
        "Search term for title/description",
      ),
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
    execute: async (filters) => {
      const result = await getTodosAction(userId, filters);

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
  const getSingleTodo = tool({
    description: "Get detailed information about a specific todo by its ID",
    inputSchema: z.object({
      todoId: z.string().describe("The ID of the todo to retrieve"),
    }),
    execute: async ({ todoId }) => {
      const result = await getTodoAction(todoId);

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
  const createTodo = tool({
    description:
      `Create a new todo item. This action requires user confirmation.
    Use this when the user explicitly wants to create a todo.
    Before calling this, ensure you understand what todo they want to create.`,
    inputSchema: z.object({
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
      const result = await upsertTodoAction(todoData);

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
  const updateTodo = tool({
    description:
      `Update an existing todo item. This action requires user confirmation.
    Use this when the user wants to modify a todo's details, mark it complete/incomplete, or change its priority.`,
    inputSchema: z.object({
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
      todoId,
      title,
      description,
      completed,
      priority,
      dueDate,
      needsConfirmation,
    }) => {
      // First get the existing todo to show what's changing
      const existingResult = await getTodoAction(todoId);
      if (existingResult.error || !existingResult.data) {
        return {
          success: false,
          error: "Todo not found",
        };
      }

      const existing = existingResult.data[0];

      const todoData: DatabaseTables["todos"]["Insert"] & { id: string } = {
        id: todoId,
        user_id: userId,
        title: title !== undefined ? title : existing.title,
        description: description !== undefined
          ? description
          : existing.description,
        completed: completed !== undefined ? completed : existing.completed,
        priority: priority !== undefined ? priority : existing.priority,
        due_date: dueDate !== undefined ? dueDate : existing.due_date,
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
          `This will update ${
            Object.keys(changes).length
          } field(s) of the todo.`,
          todoData,
        );
      }

      // Execute the action
      const result = await upsertTodoAction(todoData);

      if (result.error) {
        return {
          success: false,
          error: result.error,
        };
      }

      return {
        success: true,
        message: `Successfully updated todo: "${todoData.title}"`,
        todo: result.data,
      };
    },
  });

  /**
   * Delete a todo (requires confirmation)
   */
  const deleteTodo = tool({
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
      const existingResult = await getTodoAction(todoId);
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
      const result = await deleteTodoAction(todoId);

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
  const bulkUpdateTodos = tool({
    description:
      `Update multiple todos at once (e.g., mark all as complete, change priority for several items).
    This action requires user confirmation and shows the impact of the bulk operation.`,
    inputSchema: z.object({
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
    execute: async ({ todoIds, updates, needsConfirmation }) => {
      // Get all todos to show what will change
      const todosToUpdate = await Promise.all(
        todoIds.map((id) => getTodoAction(id)),
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
          upsertTodoAction({
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

  /**
   * Bulk insert todos from natural language description (requires confirmation)
   */
  const bulkInsertTodos = tool({
    description:
      `Create multiple todos at once from a natural language description or list.
    Use this when the user wants to create several todos in one go.
    Examples: "Add todos for washing dishes, laundry, and groceries" or "Create a todo list for my weekly tasks".
    This action requires user confirmation and shows all todos that will be created.`,
    inputSchema: z.object({
      todos: z
        .array(
          z.object({
            title: z.string().describe("The todo title"),
            description: z.string().optional().describe("Optional description"),
            priority: z
              .enum(["low", "medium", "high"])
              .optional()
              .describe("Priority level"),
            dueDate: z.string().optional().describe("Due date in ISO format"),
          }),
        )
        .describe("Array of todos to create"),
      needsConfirmation: z
        .boolean()
        .default(true)
        .describe("Whether this action needs user confirmation"),
    }),
    execute: async ({ todos, needsConfirmation }) => {
      if (todos.length === 0) {
        return {
          success: false,
          error: "No todos provided",
        };
      }

      // Prepare todo data for insertion
      const todosData: Array<DatabaseTables["todos"]["Insert"]> = todos.map(
        (todo) => ({
          user_id: userId,
          title: todo.title,
          description: todo.description || null,
          priority: todo.priority || null,
          due_date: todo.dueDate || null,
          completed: false,
        }),
      );

      // If confirmation is needed, return confirmation request
      if (needsConfirmation) {
        return createConfirmationRequest(
          "bulk_insert_todos",
          `Create ${todos.length} new todo(s)`,
          {
            count: todos.length,
            todos: todos.map((t) => ({
              title: t.title,
              description: t.description || "No description",
              priority: t.priority || "Not set",
              dueDate: t.dueDate || "No due date",
            })),
          },
          `This will create ${todos.length} new todo item(s) in your list.`,
          todosData,
        );
      }

      // Execute the bulk insert
      const result = await bulkInsertTodosAction(todosData);

      if (result.error) {
        return {
          success: false,
          error: result.error,
        };
      }

      return {
        success: true,
        message: `Successfully created ${todos.length} todo(s)`,
        todos: result.data,
        count: todos.length,
      };
    },
  });

  return {
    listTodos,
    getSingleTodo,
    createTodo,
    updateTodo,
    deleteTodo,
    bulkUpdateTodos,
    bulkInsertTodos,
  };
}
