import { tool } from "ai";
import { z } from "zod";
import Perplexity from "@perplexity-ai/perplexity_ai";
import { env } from "@/env.mjs";

/**
 * Web search tool using Perplexity API
 * Allows the agent to search the web for current information
 */

/**
 * Create Perplexity client (lazy initialization)
 */
function getPerplexityClient() {
  if (!env.PERPLEXITY_API_KEY) {
    throw new Error(
      "PERPLEXITY_API_KEY is not configured. Web search is unavailable."
    );
  }
  return new Perplexity({ apiKey: env.PERPLEXITY_API_KEY });
}

/**
 * Web search tool for the agent
 * Uses Perplexity's search API to retrieve ranked web results
 */
export const webSearch = tool({
  description: `Search the web for current, up-to-date information. Use this when:
- User asks about recent events, news, or current information
- User mentions URLs, domains, or web content (http://, https://, www., .com, .org, etc.)
- Query requires real-time data or latest information
- User explicitly asks to "search the web", "look online", "find on the internet"
- Information is time-sensitive or may have changed recently
- You need to verify facts or find authoritative sources

Do NOT use for:
- General knowledge questions you can answer confidently
- Historical facts that don't change
- Basic definitions or concepts
- Math or logic problems`,

  inputSchema: z.object({
    query: z
      .string()
      .min(1)
      .max(200)
      .describe(
        "The search query. Be specific and concise. Include relevant keywords."
      ),
    maxResults: z
      .number()
      .min(1)
      .max(20)
      .default(5)
      .describe("Maximum number of results to return (1-20, default: 5)"),
    country: z
      .string()
      .length(2)
      .optional()
      .describe(
        "ISO 3166-1 alpha-2 country code for regional results (e.g., 'US', 'GB', 'DE')"
      ),
  }),

  execute: async ({ query, maxResults, country }) => {
    try {
      console.log("[Web Search] Executing search:", {
        query,
        maxResults,
        country,
      });

      const client = getPerplexityClient();

      // Execute search
      const search = await client.search.create({
        query,
        max_results: maxResults,
        max_tokens_per_page: 1024, // Balanced content extraction
        ...(country && { country }),
      });

      console.log("[Web Search] Search completed:", {
        resultCount: search.results.length,
        searchId: search.id,
      });

      // Transform results for the agent
      const results = search.results.map((result) => ({
        title: result.title,
        url: result.url,
        snippet: result.snippet?.slice(0, 500) || "", // Limit snippet length
        publishedDate: result.date,
        lastUpdated: result.last_updated,
      }));

      return {
        success: true,
        query,
        resultCount: results.length,
        results,
        searchId: search.id,
      };
    } catch (error) {
      console.error("[Web Search] Error:", error);

      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes("PERPLEXITY_API_KEY")) {
          return {
            success: false,
            error: "Web search is not configured. Please add PERPLEXITY_API_KEY to your environment variables.",
            userMessage: "Web search is currently unavailable due to missing API configuration.",
          };
        }

        // Check for authentication errors (401)
        if (error.message.includes("401")) {
          return {
            success: false,
            error: "Web search authentication failed (401).",
            userMessage: "Web search is currently unavailable. Please try again later.",
          };
        }
      }

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to execute web search",
        userMessage: "Web search is currently unavailable. Please try again later.",
      };
    }
  },
});

/**
 * Multi-query web search tool
 * Allows searching multiple related queries in a single request
 */
export const multiWebSearch = tool({
  description: `Execute multiple related web searches simultaneously. Use this when:
- Need to explore different angles of a topic
- Comparing multiple subjects or viewpoints
- Research requires comprehensive coverage of related queries
- User asks compound questions that need separate searches

Maximum 5 queries per request.`,

  inputSchema: z.object({
    queries: z
      .array(z.string().min(1).max(200))
      .min(1)
      .max(5)
      .describe("Array of search queries (1-5 queries)"),
    maxResultsPerQuery: z
      .number()
      .min(1)
      .max(10)
      .default(3)
      .describe("Maximum results per query (1-10, default: 3)"),
    country: z
      .string()
      .length(2)
      .optional()
      .describe("ISO country code for regional results"),
  }),

  execute: async ({ queries, maxResultsPerQuery, country }) => {
    try {
      console.log("[Multi Web Search] Executing searches:", {
        queryCount: queries.length,
        maxResultsPerQuery,
        country,
      });

      const client = getPerplexityClient();

      // Execute multi-query search
      const search = await client.search.create({
        query: queries,
        max_results: maxResultsPerQuery,
        max_tokens_per_page: 1024,
        ...(country && { country }),
      });

      console.log("[Multi Web Search] Searches completed");

      // Transform results (results is an array of arrays for multi-query)
      const allResults = search.results.map((queryResults: any, index: number) => ({
        query: queries[index],
        resultCount: queryResults.length,
        results: queryResults.map((result: any) => ({
          title: result.title,
          url: result.url,
          snippet: result.snippet?.slice(0, 500) || "",
          publishedDate: result.date,
          lastUpdated: result.last_updated,
        })),
      }));

      return {
        success: true,
        queries,
        queryCount: queries.length,
        results: allResults,
        searchId: search.id,
      };
    } catch (error) {
      console.error("[Multi Web Search] Error:", error);

      if (error instanceof Error && error.message.includes("PERPLEXITY_API_KEY")) {
        return {
          success: false,
          error: "Web search is not configured. Please add PERPLEXITY_API_KEY to your environment variables.",
          userMessage: "Web search is currently unavailable due to missing API configuration.",
        };
      }

      // Check for authentication errors (401)
      if (error instanceof Error && error.message.includes("401")) {
        return {
          success: false,
          error: "Web search authentication failed (401).",
          userMessage: "Web search is currently unavailable. Please try again later.",
        };
      }

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to execute multi-query web search",
        userMessage: "Web search is currently unavailable. Please try again later.",
      };
    }
  },
});

/**
 * Domain-filtered web search
 * Search within specific domains or URLs
 */
export const domainWebSearch = tool({
  description: `Search within specific domains or websites. Use this when:
- User wants results from specific authoritative sources
- Research requires academic or official sources
- Need to verify information from particular websites
- User specifies domains like "search on science.org" or "find on github.com"

Maximum 20 domains per search.`,

  inputSchema: z.object({
    query: z.string().min(1).max(200).describe("The search query"),
    domains: z
      .array(z.string())
      .min(1)
      .max(20)
      .describe(
        "Array of domain names to search (e.g., ['science.org', 'nature.com'])"
      ),
    maxResults: z
      .number()
      .min(1)
      .max(20)
      .default(10)
      .describe("Maximum number of results"),
  }),

  execute: async ({ query, domains, maxResults }) => {
    try {
      console.log("[Domain Web Search] Executing search:", {
        query,
        domainCount: domains.length,
        domains,
        maxResults,
      });

      const client = getPerplexityClient();

      // Execute domain-filtered search
      const search = await client.search.create({
        query,
        search_domain_filter: domains,
        max_results: maxResults,
        max_tokens_per_page: 1024,
      });

      console.log("[Domain Web Search] Search completed:", {
        resultCount: search.results.length,
      });

      const results = search.results.map((result) => ({
        title: result.title,
        url: result.url,
        snippet: result.snippet?.slice(0, 500) || "",
        publishedDate: result.date,
        lastUpdated: result.last_updated,
      }));

      return {
        success: true,
        query,
        domains,
        resultCount: results.length,
        results,
        searchId: search.id,
      };
    } catch (error) {
      console.error("[Domain Web Search] Error:", error);

      if (error instanceof Error && error.message.includes("PERPLEXITY_API_KEY")) {
        return {
          success: false,
          error: "Web search is not configured.",
          userMessage: "Web search is currently unavailable due to missing API configuration.",
        };
      }

      // Check for authentication errors (401)
      if (error instanceof Error && error.message.includes("401")) {
        return {
          success: false,
          error: "Web search authentication failed (401).",
          userMessage: "Web search is currently unavailable. Please try again later.",
        };
      }

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to execute domain search",
        userMessage: "Web search is currently unavailable. Please try again later.",
      };
    }
  },
});
