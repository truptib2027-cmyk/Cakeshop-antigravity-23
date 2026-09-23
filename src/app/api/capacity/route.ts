import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/db/dataStore";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate") || new Date().toISOString().split("T")[0];
    const days = parseInt(searchParams.get("days") || "14", 10);

    const capacities = dataStore.getCapacityRange(startDate, days);
    const slots = dataStore.getPickupSlots();

    return NextResponse.json({
      capacities,
      slots,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch capacity" }, { status: 500 });
  }
}
