/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useCart } from "@/contexts/CartContext";
import QuantityInput from "./QuantityInput";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Product {
  id: number;
  sku: string;
  title: string;
  description: string;
  manufacturer: string;
  category: string;
  uom: string;
  qtyAvailable: number;
  tags: string;
  imageSrc: string | null;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { data: session } = useSession();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();

  const handleAddToCart = () => {
    addItem(
      {
        id: String(product.id),
        sku: product.sku,
        title: product.title,
        manufacturer: product.manufacturer,
        category: product.category,
        uom: product.uom,
        imageSrc: product.imageSrc,
      },
      quantity
    );
  };

  const handleMoreLikeThis = (e: React.MouseEvent) => {
    e.preventDefault();
    const encodedCategory = encodeURIComponent(
      encodeURIComponent(product.category)
    );
    router.push(`/products?category=${encodedCategory}&page=1`);
  };

  const handleMoreOfPattern = (e: React.MouseEvent) => {
    e.preventDefault();
    const patternMatch = product.tags.match(/PATTERN_([^,]+)/);
    if (patternMatch) {
      const pattern = `PATTERN_${patternMatch[1]}`;
      const encodedPattern = encodeURIComponent(pattern);
      router.push(`/products?tags=${encodedPattern}&page=1`);
    }
  };

  const hasPattern = product.tags.includes("PATTERN_");

  const hasCollection = product.tags.includes("COLLECTION_");

  const handleMoreFromCollection = (e: React.MouseEvent) => {
    e.preventDefault();
    const collectionMatch = product.tags.match(/COLLECTION_([^,]+)/);
    if (collectionMatch) {
      const collection = collectionMatch[1];
      router.push(`/products?page=1&tags=${collection}`);
    }
  };

  return (
    <Link href={`/product/${product.sku}`}>
      <div className="group relative border rounded-lg p-2 sm:p-4 hover:shadow-lg transition-shadow bg-white">
        {/* Image */}
        <div className="aspect-square bg-gray-100 mb-2 sm:mb-4 flex items-center justify-center overflow-hidden rounded">
          {product.imageSrc ? (
            <img
              src={product.imageSrc}
              alt={product.title}
              className="object-contain h-full w-full p-1 sm:p-2 group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="text-gray-400 text-sm">No image</div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-1 sm:space-y-2">
          <h3 className="font-medium text-gray-900 text-xs sm:text-sm line-clamp-2">
            {product.title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-900">SKU: {product.sku}</p>
          <p className="text-xs sm:text-sm text-gray-900">
            {product.manufacturer}
          </p>

          {/* Availability */}
          {product.qtyAvailable > 0 && (
            <p className="text-xs sm:text-sm text-green-600">In Stock</p>
          )}

          {/* Filter Links */}
          <div className="space-y-1 mt-2">
            <button
              onClick={handleMoreLikeThis}
              className="text-xs text-blue-600 hover:text-blue-800 block w-full text-left"
            >
              More Like This : {product.category}
            </button>
            {hasCollection && (
              <button
                onClick={handleMoreFromCollection}
                className="text-xs text-blue-600 hover:text-blue-800 block w-full text-left capitalize"
              >
                More From Collection :{" "}
                {product.tags.match(/COLLECTION_([^,]+)/)?.[1].toLowerCase()}
              </button>
            )}
            {hasPattern && (
              <button
                onClick={handleMoreOfPattern}
                className="text-xs text-blue-600 hover:text-blue-800 block w-full text-left capitalize"
              >
                More of This Pattern :{" "}
                {product.tags.match(/PATTERN_([^,]+)/)?.[1].toLowerCase()}
              </button>
            )}
          </div>

          {/* Cart Controls - Only show if logged in */}
          {session?.user && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-2">
              <div className="flex-1">
                <QuantityInput
                  onQuantityChange={setQuantity}
                  initialQuantity={1}
                  max={product.qtyAvailable}
                  className="w-full"
                />
              </div>
              <button
                onClick={handleAddToCart}
                className="bg-blue-600 text-white text-xs sm:text-sm px-3 py-1.5 rounded hover:bg-blue-700 transition-colors w-full sm:w-auto"
              >
                Add to Cart
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
