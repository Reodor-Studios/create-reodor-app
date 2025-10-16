import { NextRequest, NextResponse } from "next/server";

/**
 * Demo cron job endpoint
 *
 * This is a sample cron job that can be triggered by Vercel Cron or any other scheduler.
 *
 * To set up in Vercel, add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/demo",
 *     "schedule": "0 0 * * *"  // Runs daily at midnight
 *   }]
 * }
 *
 * For security, you should verify the request is from Vercel Cron:
 * - Check the Authorization header
 * - Or use Vercel's CRON_SECRET environment variable
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from a valid cron source
    const authHeader = request.headers.get("authorization");
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET) {
      console.error("[DEMO_CRON] CRON_SECRET is not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (authHeader !== expectedAuth) {
      console.error("[DEMO_CRON] Unauthorized cron request attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const timestamp = new Date().toISOString();

    console.log("=".repeat(60));
    console.log("[DEMO_CRON] Cron job executed successfully!");
    console.log(`[DEMO_CRON] Timestamp: ${timestamp}`);
    console.log(`[DEMO_CRON] This is a demo cron job.`);
    console.log("=".repeat(60));

    // You can add your actual cron job logic here
    // For example:
    // - Send scheduled emails
    // - Clean up old data
    // - Generate reports
    // - Sync data with external services

    return NextResponse.json({
      success: true,
      message: "Demo cron job executed successfully",
      timestamp,
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error("[DEMO_CRON] Error executing cron job:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to execute cron job",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
