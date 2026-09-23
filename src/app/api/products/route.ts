import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/db/dataStore";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("category") || undefined;
    const dietaryTag = searchParams.get("dietary") || undefined;
    const flavour = searchParams.get("flavour") || undefined;
    const size = searchParams.get("size") || undefined;
    const search = searchParams.get("q") || undefined;
    const maxPrice = searchParams.get("maxPrice") ? parseInt(searchParams.get("maxPrice")!, 10) : undefined;

    const products = dataStore.getProducts({
      categorySlug,
      dietaryTag,
      flavour,
      size,
      search,
      maxPrice,
    });

    const categories = dataStore.getCategories();
    const dietaryTags = dataStore.getDietaryTags();

    return NextResponse.json({
      products,
      categories,
      dietaryTags,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch products" }, { status: 500 });
  }
}
