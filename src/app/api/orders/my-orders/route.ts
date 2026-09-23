import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/db/dataStore";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const orders = dataStore.getOrdersByUser(user.id);
    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch orders" }, { status: 500 });
  }
}
