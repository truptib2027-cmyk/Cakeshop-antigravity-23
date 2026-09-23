import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/db/dataStore";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required." }, { status: 400 });
    }

    const cancelledOrder = await dataStore.cancelOrder(orderId, user.id);

    return NextResponse.json({
      success: true,
      order: cancelledOrder,
      message: "Order successfully cancelled. Capacity has been restored.",
    });
  } catch (error: any) {
    console.error("Order cancellation error:", error.message);
    const statusCode = error.message.includes("Unauthorized")
      ? 403
      : error.message.includes("not found")
      ? 404
      : 400;

    return NextResponse.json({ error: error.message || "Failed to cancel order" }, { status: statusCode });
  }
}
