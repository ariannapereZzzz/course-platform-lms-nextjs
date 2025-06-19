import { NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { ProductTable } from "@/drizzle/schema";
import { getCurrentUser } from "@/services/clerk";

export async function GET() {
  try {
    const products = await db.select().from(ProductTable);
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, redirectToSignIn } = await getCurrentUser();

    if (!userId) {
      return redirectToSignIn();
    }

    const body = await request.json();
    const {
      name,
      description,
      imageUrl,
      priceInDollars,
      status = "private",
    } = body;

    if (!name || !description || !imageUrl || !priceInDollars) {
      return NextResponse.json(
        {
          error: "Name, description, imageUrl, and priceInDollars are required",
        },
        { status: 400 }
      );
    }

    const [newProduct] = await db
      .insert(ProductTable)
      .values({
        name,
        description,
        imageUrl,
        priceInDollars,
        status,
      })
      .returning();

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
