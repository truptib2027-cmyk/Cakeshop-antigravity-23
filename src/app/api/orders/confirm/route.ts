import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/db/dataStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, idempotencyKey, provider = "test_gateway", transactionId } = body;

    if (!orderId || !idempotencyKey) {
      return NextResponse.json(
        { error: "orderId and idempotencyKey are required." },
        { status: 400 }
      );
    }

    const { order, payment } = await dataStore.confirmOrder({
      orderId,
      idempotencyKey,
      provider,
      transactionId,
    });

    return NextResponse.json({
      success: true,
      order,
      payment,
      message: "Order confirmed successfully!",
    });
  } catch (error: any) {
    console.error("Order confirmation error:", error.message);
    const statusCode = error.message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: error.message || "Confirmation failed" }, { status: statusCode });
  }
}
