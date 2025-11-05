import { tool } from "ai";
import { z } from "zod";

/**
 * Get the current date and time
 */
export const getCurrentDateTime = tool({
  description:
    "Get the current date and time. Use this to answer questions about today's date, current time, or to calculate relative dates.",
  inputSchema: z.object({
    timezone: z
      .string()
      .optional()
      .describe(
        "Optional timezone in IANA format (e.g., 'America/New_York', 'Europe/London'). Defaults to UTC.",
      ),
  }),
  execute: async ({ timezone = "UTC" }) => {
    const now = new Date();

    // Get formatted date in the specified timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      weekday: "long",
      timeZoneName: "long",
    });

    const formatted = formatter.format(now);

    // Get ISO string for programmatic use
    const isoString = now.toISOString();

    // Calculate additional useful information
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 0-indexed
    const day = now.getDate();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const weekNumber = Math.ceil(
      (now.getTime() - new Date(year, 0, 1).getTime()) / 604800000,
    );

    return {
      formatted,
      isoString,
      timezone,
      year,
      month,
      day,
      dayOfWeek,
      weekNumber,
      timestamp: now.getTime(),
    };
  },
});

/**
 * Calculate a relative date from today
 */
export const getRelativeDate = tool({
  description:
    "Calculate a date relative to today (e.g., 'yesterday', 'last week', 'next month', '3 days ago', '2 weeks from now'). Useful for understanding temporal references.",
  inputSchema: z.object({
    offset: z
      .number()
      .describe(
        "The number of time units to offset. Use negative numbers for past dates.",
      ),
    unit: z
      .enum(["day", "week", "month", "year"])
      .describe("The unit of time to offset by"),
    timezone: z
      .string()
      .optional()
      .describe(
        "Optional timezone in IANA format (e.g., 'America/New_York'). Defaults to UTC.",
      ),
  }),
  execute: async ({ offset, unit, timezone = "UTC" }) => {
    const now = new Date();
    const targetDate = new Date(now);

    // Calculate the target date based on offset and unit
    switch (unit) {
      case "day":
        targetDate.setDate(targetDate.getDate() + offset);
        break;
      case "week":
        targetDate.setDate(targetDate.getDate() + offset * 7);
        break;
      case "month":
        targetDate.setMonth(targetDate.getMonth() + offset);
        break;
      case "year":
        targetDate.setFullYear(targetDate.getFullYear() + offset);
        break;
    }

    // Format the target date
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });

    const formatted = formatter.format(targetDate);
    const isoString = targetDate.toISOString();

    // Calculate if it's in the past or future
    const isPast = targetDate < now;
    const isFuture = targetDate > now;
    const isToday =
      targetDate.toDateString() === now.toDateString();

    // Calculate days difference
    const daysDifference = Math.floor(
      (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      formatted,
      isoString,
      timezone,
      isPast,
      isFuture,
      isToday,
      daysDifference,
      year: targetDate.getFullYear(),
      month: targetDate.getMonth() + 1,
      day: targetDate.getDate(),
    };
  },
});

/**
 * Get date range for common periods
 */
export const getDateRange = tool({
  description:
    "Get the start and end dates for common time periods like 'this week', 'this month', 'this year', 'last week', 'last month', 'last year', etc.",
  inputSchema: z.object({
    period: z
      .enum([
        "today",
        "yesterday",
        "this_week",
        "last_week",
        "this_month",
        "last_month",
        "this_year",
        "last_year",
      ])
      .describe("The time period to get the date range for"),
    timezone: z
      .string()
      .optional()
      .describe(
        "Optional timezone in IANA format. Defaults to UTC.",
      ),
  }),
  execute: async ({ period, timezone = "UTC" }) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;

      case "yesterday":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "this_week":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - startDate.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "last_week":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - startDate.getDay() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "this_month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;

      case "last_month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;

      case "this_year":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;

      case "last_year":
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        break;
    }

    // Format dates
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return {
      period,
      startDate: {
        formatted: formatter.format(startDate),
        isoString: startDate.toISOString(),
      },
      endDate: {
        formatted: formatter.format(endDate),
        isoString: endDate.toISOString(),
      },
      timezone,
      daysInPeriod: Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1,
    };
  },
});
