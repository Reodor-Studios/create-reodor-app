import type { SeedClient, todosScalars, usersScalars } from "@snaplet/seed";
import { addDays, subDays } from "date-fns";
import { DatabaseTables } from "./shared";
import { getRandomAttachmentImages } from "./media";

/**
 * Todo templates for generating realistic todo items
 */
const todoTemplates = [
  {
    title: "Complete project documentation",
    description:
      "Write comprehensive documentation for the new feature, including API docs and user guide",
    priority: "high" as const,
  },
  {
    title: "Review pull requests",
    description:
      "Review and provide feedback on open pull requests from team members",
    priority: "medium" as const,
  },
  {
    title: "Fix bug in authentication flow",
    description:
      "Users are reporting issues with password reset functionality - investigate and fix",
    priority: "high" as const,
  },
  {
    title: "Update dependencies",
    description:
      "Update project dependencies to latest stable versions and test for breaking changes",
    priority: "low" as const,
  },
  {
    title: "Prepare presentation for team meeting",
    description:
      "Create slides for weekly team standup showcasing recent progress",
    priority: "medium" as const,
  },
  {
    title: "Implement dark mode toggle",
    description:
      "Add dark mode support to the application with user preference persistence",
    priority: "medium" as const,
  },
  {
    title: "Optimize database queries",
    description:
      "Analyze and optimize slow database queries identified in production monitoring",
    priority: "high" as const,
  },
  {
    title: "Write unit tests for new feature",
    description:
      "Add comprehensive unit tests for the recently implemented search functionality",
    priority: "high" as const,
  },
  {
    title: "Schedule team retrospective",
    description:
      "Organize and schedule next sprint retrospective meeting with the team",
    priority: "low" as const,
  },
  {
    title: "Research new UI component library",
    description:
      "Evaluate potential UI component libraries for upcoming redesign project",
    priority: "low" as const,
  },
  {
    title: "Set up CI/CD pipeline",
    description:
      "Configure automated testing and deployment pipeline for the project",
    priority: "high" as const,
  },
  {
    title: "Refactor authentication module",
    description:
      "Clean up authentication code and improve error handling and user feedback",
    priority: "medium" as const,
  },
  {
    title: "Create onboarding tutorial",
    description:
      "Design and implement an interactive onboarding flow for new users",
    priority: "medium" as const,
  },
  {
    title: "Conduct code review training",
    description:
      "Organize workshop to improve team's code review practices and standards",
    priority: "low" as const,
  },
  {
    title: "Migrate to new hosting provider",
    description:
      "Plan and execute migration to new cloud hosting provider for better performance",
    priority: "medium" as const,
  },
];

/**
 * Creates a variety of todo items for all users
 * Some completed, some pending, with various priorities and due dates
 */
export async function createTodoItems(
  seed: SeedClient,
  users: usersScalars[],
) {
  console.log("-- Creating todo items for users...");

  const todosToCreate: DatabaseTables["todos"]["Insert"][] = [];
  const now = new Date();

  // Create 3-5 todos for each user
  for (const user of users) {
    const todoCount = Math.floor(Math.random() * 3) + 3; // 3-5 todos per user

    for (let i = 0; i < todoCount; i++) {
      const template =
        todoTemplates[Math.floor(Math.random() * todoTemplates.length)];
      const isCompleted = Math.random() > 0.6; // 40% completed
      const hasDueDate = Math.random() > 0.3; // 70% have due dates

      let dueDate: Date | undefined;
      if (hasDueDate) {
        if (isCompleted) {
          // Completed todos have past due dates
          dueDate = subDays(now, Math.floor(Math.random() * 14) + 1);
        } else {
          // Pending todos have future due dates (some overdue)
          const daysOffset = Math.floor(Math.random() * 21) - 7; // -7 to +14 days
          dueDate = addDays(now, daysOffset);
        }
      }

      const todo: DatabaseTables["todos"]["Insert"] = {
        user_id: user.id,
        title: template.title,
        description: template.description,
        priority: template.priority,
        completed: isCompleted,
        due_date: dueDate?.toISOString(),
        created_at: subDays(now, Math.floor(Math.random() * 30)).toISOString(),
      };

      todosToCreate.push(todo);
    }
  }

  const { todos } = await seed.todos(todosToCreate);

  console.log(`-- Created ${todos.length} todo items`);
  return todos;
}

/**
 * Creates media attachments for todo items
 * Randomly assigns 0-3 attachments per todo
 */
export async function createTodoAttachments(
  seed: SeedClient,
  todos: todosScalars[],
) {
  console.log("-- Creating todo attachments...");

  const mediaToCreate: DatabaseTables["media"]["Insert"][] = [];

  for (const todo of todos) {
    // 50% chance of having attachments
    const hasAttachments = Math.random() > 0.5;

    if (hasAttachments) {
      // Random number of attachments (1-3)
      const attachmentCount = Math.floor(Math.random() * 3) + 1;
      const attachmentImages = getRandomAttachmentImages(attachmentCount);

      for (const imagePath of attachmentImages) {
        const media: DatabaseTables["media"]["Insert"] = {
          file_path: imagePath,
          media_type: "todo_attachment",
          owner_id: todo.user_id,
          todo_id: todo.id,
        };

        mediaToCreate.push(media);
      }
    }
  }

  const result = await seed.media(mediaToCreate);

  console.log(`-- Created ${result.media.length} todo attachments`);
  return result.media;
}
