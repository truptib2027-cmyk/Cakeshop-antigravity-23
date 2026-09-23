import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/db/dataStore";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "baker") {
      return NextResponse.json({ error: "Forbidden: Baker credentials required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");

    const orders = dateStr ? dataStore.getOrdersByDate(dateStr) : dataStore.getAllOrders();

    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch baker orders" }, { status: 500 });
  }
}
