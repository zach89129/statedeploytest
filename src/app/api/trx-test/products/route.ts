import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { convertBigIntToString } from "@/utils/convertBigIntToString";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids = [] } = body;

    // Validate that ids is an array
    if (!Array.isArray(ids)) {
      return NextResponse.json(
        { error: "Invalid request format. Expected 'ids' to be an array." },
        { status: 400 }
      );
    }

    let products;

    // If ids array is empty, return all products
    if (ids.length === 0) {
      products = await prisma.product.findMany({
        select: {
          id: true,
          sku: true,
          title: true,
          description: true,
          manufacturer: true,
          category: true,
          uom: true,
          qtyAvailable: true,
          tags: true,
          imageSrc: true,
        },
      });

      // Convert BigInt id to string for JSON serialization
      products = products.map((product) => {
        const { id, ...rest } = product;
        return {
          trx_product_id: String(id),
          ...rest,
        };
      });
    } else {
      // Convert all ids to BigInt
      const productIds = ids.map((id) => BigInt(id));

      // Return only the products with the specified ids
      products = await prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
        },
        select: {
          id: true,
          sku: true,
          title: true,
          description: true,
          manufacturer: true,
          category: true,
          uom: true,
          qtyAvailable: true,
          tags: true,
          imageSrc: true,
        },
      });

      // Convert BigInt id to string for JSON serialization
      products = products.map((product) => {
        const { id, ...rest } = product;
        return {
          ...rest,
          trx_product_id: String(id),
        };
      });
    }

    // Convert any remaining BigInt values to strings
    const safeProducts = convertBigIntToString(products);

    return NextResponse.json({
      success: true,
      products: safeProducts,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
