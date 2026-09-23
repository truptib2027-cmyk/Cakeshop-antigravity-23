import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/db/dataStore";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pickupDate, pickupSlotId, items, customerName, customerEmail, customerPhone, notes } = body;

    if (!pickupDate || !pickupSlotId || !items || !items.length) {
      return NextResponse.json(
        { error: "Pickup date, pickup slot, and order items are required." },
        { status: 400 }
      );
    }

    if (!customerName || !customerEmail || !customerPhone) {
      return NextResponse.json(
        { error: "Customer name, email, and phone are required." },
        { status: 400 }
      );
    }

    // Get current logged-in user if available
    const user = await getCurrentUser(req);

    // Call transactional order reservation engine
    const { order, holdExpiresAt } = await dataStore.reserveOrder({
      pickupDate,
      pickupSlotId,
      items,
      customerName,
      customerEmail,
      customerPhone,
      notes,
      userId: user?.id,
    });

    return NextResponse.json({
      success: true,
      order,
      holdExpiresAt,
      message: "Temporary reservation placed. Please complete payment within 10 minutes.",
    });
  } catch (error: any) {
    console.error("Order reservation error:", error.message);
    const statusCode = error.message.includes("Minimum lead time") ||
      error.message.includes("exceeds 40 characters") ||
      error.message.includes("closed")
      ? 400
      : error.message.includes("Insufficient capacity") || error.message.includes("fully booked")
      ? 409
      : 500;

    return NextResponse.json({ error: error.message || "Reservation failed" }, { status: statusCode });
  }
}
