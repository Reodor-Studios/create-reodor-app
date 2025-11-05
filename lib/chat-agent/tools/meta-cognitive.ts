import { tool } from "ai";
import { z } from "zod";

/**
 * Plan the steps needed to answer a user query
 * This tool helps the agent think through what tools it needs to use
 */
export const planApproach = tool({
  description:
    "Plan the approach to answer a user query by analyzing what tools are available and what steps are needed. Use this tool when you receive a new query to organize your thinking before taking action.",
  inputSchema: z.object({
    userQuery: z
      .string()
      .describe("The user's question or request that needs to be addressed"),
    availableTools: z
      .array(z.string())
      .describe(
        "List of tool names that are available to help answer the query",
      ),
    reasoning: z
      .string()
      .describe(
        "Your initial reasoning about how to approach this query and which tools might be useful",
      ),
  }),
  execute: async ({ userQuery, availableTools, reasoning }) => {
    // This is a meta-cognitive tool that helps structure the agent's thinking
    // The actual planning happens in the agent's reasoning, this tool just formalizes it

    // Analyze the query to extract key information needs
    const queryLowerCase = userQuery.toLowerCase();
    const hasTemporalReference =
      /today|yesterday|tomorrow|this week|last month|next year|ago|from now/i.test(
        userQuery,
      );
    const needsDateTime =
      /time|date|when|day|week|month|year/i.test(queryLowerCase);

    // Suggest relevant tools based on query analysis
    const suggestedTools: string[] = [];
    if (hasTemporalReference || needsDateTime) {
      if (availableTools.includes("getCurrentDateTime")) {
        suggestedTools.push("getCurrentDateTime");
      }
      if (availableTools.includes("getRelativeDate")) {
        suggestedTools.push("getRelativeDate");
      }
      if (availableTools.includes("getDateRange")) {
        suggestedTools.push("getDateRange");
      }
    }

    // Generate a structured plan
    const plan = {
      query: userQuery,
      analysis: {
        hasTemporalReference,
        needsDateTime,
        keyTerms: extractKeyTerms(userQuery),
      },
      suggestedApproach: reasoning,
      recommendedTools: suggestedTools.length > 0 ? suggestedTools : ["No specific tools needed - respond directly"],
      estimatedSteps: suggestedTools.length || 1,
    };

    return {
      success: true,
      plan,
      message: `Analyzed query and created plan with ${plan.estimatedSteps} step(s)`,
    };
  },
});

/**
 * Evaluate whether the response adequately answers the user's query
 * This tool helps ensure quality responses
 */
export const evaluateResponse = tool({
  description:
    "Evaluate whether your response adequately addressed the user's query. Use this tool after providing an answer to ensure you've met the user's needs.",
  inputSchema: z.object({
    originalQuery: z
      .string()
      .describe("The user's original question or request"),
    responseProvided: z
      .string()
      .describe("The response you provided to the user"),
    toolsUsed: z
      .array(z.string())
      .describe("List of tools that were used in formulating the response"),
    confidence: z
      .number()
      .min(0)
      .max(100)
      .describe(
        "Your confidence level (0-100) that the response fully answers the query",
      ),
  }),
  execute: async ({
    originalQuery,
    responseProvided,
    toolsUsed,
    confidence,
  }) => {
    // Evaluate completeness
    const evaluation = {
      originalQuery,
      responseLength: responseProvided.length,
      toolsUsed,
      confidence,
      qualityMetrics: {
        isComplete: confidence >= 80,
        usedAppropriateTools: toolsUsed.length > 0,
        providedSpecificInformation: responseProvided.length > 50,
        addressedQuery: checkQueryAddressed(originalQuery, responseProvided),
      },
    };

    // Determine if the response is sufficient
    const isSufficient =
      evaluation.qualityMetrics.isComplete &&
      evaluation.qualityMetrics.addressedQuery;

    // Generate suggestions for improvement if needed
    const suggestions: string[] = [];
    if (!evaluation.qualityMetrics.isComplete) {
      suggestions.push(
        "Consider gathering more information or using additional tools",
      );
    }
    if (!evaluation.qualityMetrics.usedAppropriateTools) {
      suggestions.push(
        "Check if any tools could have provided more accurate information",
      );
    }
    if (!evaluation.qualityMetrics.providedSpecificInformation) {
      suggestions.push("Provide more detailed and specific information");
    }
    if (!evaluation.qualityMetrics.addressedQuery) {
      suggestions.push(
        "Ensure the response directly addresses all aspects of the user's query",
      );
    }

    return {
      isSufficient,
      confidence,
      evaluation,
      suggestions:
        suggestions.length > 0
          ? suggestions
          : ["Response appears to adequately address the query"],
      recommendation: isSufficient
        ? "Response is sufficient"
        : "Consider providing additional information or clarification",
    };
  },
});

/**
 * Helper function to extract key terms from a query
 */
function extractKeyTerms(query: string): string[] {
  // Remove common words and extract meaningful terms
  const commonWords = new Set([
    "what",
    "when",
    "where",
    "who",
    "why",
    "how",
    "is",
    "are",
    "was",
    "were",
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "from",
    "about",
    "can",
    "could",
    "would",
    "should",
  ]);

  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2 && !commonWords.has(word))
    .slice(0, 5); // Limit to top 5 key terms
}

/**
 * Helper function to check if the response addresses the query
 */
function checkQueryAddressed(query: string, response: string): boolean {
  const queryKeyTerms = extractKeyTerms(query);
  const responseLowerCase = response.toLowerCase();

  // Check if at least half of the key terms appear in the response
  const addressedTerms = queryKeyTerms.filter((term) =>
    responseLowerCase.includes(term),
  );

  return addressedTerms.length >= Math.ceil(queryKeyTerms.length / 2);
}
