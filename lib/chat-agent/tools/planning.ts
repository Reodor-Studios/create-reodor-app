import { tool } from "ai";
import { z } from "zod";

/**
 * Planning request type for complex queries that need clarification
 */
export type PlanningRequest = {
  requiresPlanning: true;
  plan: {
    summary: string;
    questions: Array<{
      question: string;
      rationale: string;
      options?: string[];
    }>;
    suggestedAction?: {
      type: string;
      description: string;
      steps: string[];
    };
  };
};

/**
 * Create a planning request with follow-up questions
 */
export const createPlan = tool({
  description: `Create a detailed plan with follow-up questions for complex or ambiguous requests.
  Use this when:
  - The user's request is vague or could be interpreted multiple ways
  - The action requires multiple steps or decisions
  - You need more context to provide the best solution
  - The request involves multiple todos or complex filtering

  After asking questions, you can suggest a concrete action for the user to approve.`,
  parameters: z.object({
    summary: z
      .string()
      .describe("A brief summary of what you understand the user wants"),
    questions: z
      .array(
        z.object({
          question: z
            .string()
            .describe("A specific question to clarify the request"),
          rationale: z
            .string()
            .describe("Why this question is important for the task"),
          options: z
            .array(z.string())
            .optional()
            .describe("Optional: suggested answers or choices"),
        })
      )
      .max(4)
      .describe("Up to 4 follow-up questions to clarify the request"),
    suggestedAction: z
      .object({
        type: z.string().describe("The type of action (e.g., 'bulk_update')"),
        description: z.string().describe("What the action will do"),
        steps: z
          .array(z.string())
          .describe("Step-by-step breakdown of the action"),
      })
      .optional()
      .describe(
        "Optional: A suggested action plan based on current understanding"
      ),
  }),
  execute: async ({ summary, questions, suggestedAction }: {
    summary: string;
    questions: Array<{
      question: string;
      rationale: string;
      options?: string[];
    }>;
    suggestedAction?: {
      type: string;
      description: string;
      steps: string[];
    };
  }) => {
    const planningRequest: PlanningRequest = {
      requiresPlanning: true,
      plan: {
        summary,
        questions,
        suggestedAction,
      },
    };

    return planningRequest;
  },
});

/**
 * Finalize a plan after questions are answered
 * This converts the planning phase into a concrete action
 */
export const finalizePlan = tool({
  description: `Finalize a plan after the user has answered your questions.
  Use this to transition from planning mode to action mode.
  This will present the final action for user confirmation.`,
  parameters: z.object({
    planSummary: z
      .string()
      .describe("Summary of the finalized plan based on user answers"),
    actionType: z
      .string()
      .describe(
        "The type of action to take (create_todo, update_todo, delete_todo, bulk_update)"
      ),
    actionDescription: z
      .string()
      .describe("Detailed description of what will happen"),
    actionSteps: z
      .array(z.string())
      .describe("Step-by-step breakdown of the action"),
    impact: z.string().describe("The expected impact or result"),
  }),
  execute: async ({
    planSummary,
    actionType,
    actionDescription,
    actionSteps,
    impact,
  }: {
    planSummary: string;
    actionType: string;
    actionDescription: string;
    actionSteps: string[];
    impact: string;
  }) => {
    return {
      requiresConfirmation: true,
      action: {
        type: actionType as
          | "create_todo"
          | "update_todo"
          | "delete_todo"
          | "list_todos",
        description: actionDescription,
        details: {
          summary: planSummary,
          steps: actionSteps,
        },
        impact,
      },
    };
  },
});

/**
 * Ask for more clarification during a conversation
 * This is lighter than createPlan - use for simple clarifications
 */
export const askClarification = tool({
  description: `Ask the user for clarification on a specific point.
  Use this for simple questions that don't need a full planning phase.
  Examples: "Which todo did you mean?", "What priority should this have?"`,
  parameters: z.object({
    question: z.string().describe("The clarification question to ask"),
    context: z
      .string()
      .describe("Why you're asking (helps the user understand)"),
    suggestedAnswers: z
      .array(z.string())
      .optional()
      .describe("Optional: suggested answers to choose from"),
  }),
  execute: async ({ question, context, suggestedAnswers }: {
    question: string;
    context: string;
    suggestedAnswers?: string[];
  }) => {
    return {
      requiresClarification: true,
      clarification: {
        question,
        context,
        suggestedAnswers,
      },
    };
  },
});
