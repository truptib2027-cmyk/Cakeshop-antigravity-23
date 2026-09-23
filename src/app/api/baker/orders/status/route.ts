import { NextRequest, NextResponse } from "next/server";
import { dataStore, OrderStatus } from "@/db/dataStore";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "baker") {
      return NextResponse.json({ error: "Forbidden: Baker credentials required." }, { status: 403 });
    }

    const body = await req.json();
    const { orderId, newStatus } = body;

    if (!orderId || !newStatus) {
      return NextResponse.json({ error: "orderId and newStatus are required." }, { status: 400 });
    }

    const updated = dataStore.updateOrderStatus(orderId, newStatus as OrderStatus, user.id);

    return NextResponse.json({
      success: true,
      order: updated,
      message: `Order status updated to ${newStatus}.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update order status" }, { status: 400 });
  }
}
