import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/db/dataStore";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "baker") {
      return NextResponse.json({ error: "Forbidden: Baker credentials required." }, { status: 403 });
    }

    const body = await req.json();
    const { bakeryDate, maxCakes, isClosed, notes } = body;

    if (!bakeryDate || maxCakes === undefined) {
      return NextResponse.json({ error: "bakeryDate and maxCakes are required." }, { status: 400 });
    }

    const updated = dataStore.setCapacity(bakeryDate, parseInt(maxCakes, 10), Boolean(isClosed), notes);

    return NextResponse.json({
      success: true,
      capacity: updated,
      message: `Capacity updated for ${bakeryDate}.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update capacity" }, { status: 400 });
  }
}
