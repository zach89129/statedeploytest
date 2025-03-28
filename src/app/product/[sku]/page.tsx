import { notFound } from "next/navigation";
import ProductDetail from "@/components/products/ProductDetail";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{
    sku: string;
  }>;
}

export default async function ProductPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { sku } = resolvedParams;

  // Fetch product data
  const product = await prisma.product.findFirst({
    where: {
      sku: sku,
    },
    include: {
      images: true,
    },
  });
  console.log(product);

  if (!product) {
    notFound();
  }

  const formattedProduct = {
    id: Number(product.id),
    sku: product.sku,
    title: product.title,
    description: product.description || "",
    manufacturer: product.manufacturer || "",
    category: product.category || "",
    uom: product.uom || "",
    qtyAvailable: product.qtyAvailable || 0,
    tags: product.tags || "",
    images: product.images.map((img) => ({ src: img.url })),
  };

  return <ProductDetail product={formattedProduct} />;
}
