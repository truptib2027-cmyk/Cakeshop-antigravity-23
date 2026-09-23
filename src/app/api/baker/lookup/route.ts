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
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Pickup code is required." }, { status: 400 });
    }

    const order = dataStore.getOrderByPickupCode(code);
    if (!order) {
      return NextResponse.json({ error: "No matching order found for this pickup code." }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to lookup order" }, { status: 500 });
  }
}
