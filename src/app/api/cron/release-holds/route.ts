import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/db/dataStore";

export async function GET(req: NextRequest) {
  // CRON_SECRET authorization check
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "cakecart_cron_development_secret";

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing CRON_SECRET" },
      { status: 401 }
    );
  }

  try {
    const result = await dataStore.releaseExpiredHolds();
    return NextResponse.json({
      success: true,
      message: `Released ${result.expiredCount} expired hold(s).`,
      expiredCount: result.expiredCount,
      ordersReleased: result.ordersReleased,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Cron hold release error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to release holds" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
