/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useCart } from "@/contexts/CartContext";
import QuantityInput from "./QuantityInput";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Product {
  trx_product_id: number;
  sku: string;
  title: string;
  description: string;
  manufacturer: string;
  category: string;
  uom: string;
  qtyAvailable: number;
  aqcat: string | null;
  pattern: string | null;
  quickship: boolean;
  images: { url: string }[];
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { data: session } = useSession();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem(
      {
        id: String(product.trx_product_id),
        sku: product.sku,
        title: product.title,
        manufacturer: product.manufacturer,
        category: product.category,
        uom: product.uom,
        imageSrc: product.images[0]?.url || "/noImageState.jpg",
      },
      quantity
    );
  };

  const handleMoreLikeThis = (e: React.MouseEvent) => {
    e.preventDefault();
    const base64Category = btoa(product.category);
    router.push(`/products?category_b64=${base64Category}&page=1`);
  };

  const handleMoreOfPattern = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.pattern) {
      const base64Pattern = btoa(product.pattern);
      router.push(`/products?pattern_b64=${base64Pattern}&page=1`);
    }
  };

  const handleMoreFromCollection = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.aqcat) {
      const base64Collection = btoa(product.aqcat);
      router.push(`/products?collection_b64=${base64Collection}&page=1`);
    }
  };

  return (
    <Link
      href={`/product/${product.sku}`}
      key={`product-link-${product.trx_product_id}`}
    >
      <div
        className="group relative border rounded-lg p-2 sm:p-4 hover:shadow-lg transition-shadow bg-white h-full flex flex-col justify-between"
        style={{ maxWidth: "100%", width: "100%", overflow: "hidden" }}
      >
        {/* Top content section */}
        <div className="flex flex-col">
          {/* Image container with fixed dimensions */}
          <div
            className="h-44 w-full max-w-[250px] mx-auto bg-white mb-2 sm:mb-4 flex items-center justify-center overflow-hidden rounded border border-gray-100"
            style={{ maxHeight: "176px" }}
          >
            <div
              className="flex items-center justify-center w-full h-full p-3"
              style={{ maxWidth: "100%" }}
            >
              <img
                src={product.images[0]?.url || "/noImageState.jpg"}
                alt={product.title}
                className="max-h-36 max-w-[200px] w-auto h-auto object-contain group-hover:scale-105 transition-transform duration-200"
                style={{
                  maxWidth: "100%",
                  maxHeight: "144px",
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                  objectPosition: "center",
                  display: "block",
                  margin: "0 auto",
                }}
                loading="lazy"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-1 sm:space-y-2">
            {/* Product details with fixed heights */}
            <div className="min-h-[40px] sm:min-h-[48px]">
              <h3 className="font-medium text-gray-900 text-xs sm:text-sm line-clamp-2">
                {product.title}
              </h3>
            </div>

            <div className="min-h-[20px] sm:min-h-[24px]">
              <p className="text-xs sm:text-sm text-gray-900">
                SKU: {product.sku}
              </p>
            </div>

            <div className="min-h-[20px] sm:min-h-[24px]">
              <p className="text-xs sm:text-sm text-gray-900">
                {product.manufacturer}
              </p>
            </div>

            {/* Description - Fixed height with line clamp */}
            <div className="min-h-[40px] sm:min-h-[48px]">
              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                {product.description}
              </p>
            </div>

            {/* Availability - Fixed height regardless of whether it's shown */}
            <div className="min-h-[20px] sm:min-h-[24px]">
              {product.qtyAvailable > 0 && (
                <p className="text-xs sm:text-sm text-green-600">In Stock</p>
              )}
            </div>

            {/* Filter Links - Fixed height section */}
            <div className="space-y-1 mt-2 min-h-[60px] sm:min-h-[72px]">
              {product.aqcat && (
                <button
                  onClick={handleMoreFromCollection}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 block w-full text-left"
                >
                  More Like This: {product.aqcat}
                </button>
              )}
              {product.pattern && (
                <button
                  onClick={handleMoreOfPattern}
                  className="text-xs text-blue-600 hover:text-blue-800 block w-full text-left capitalize"
                >
                  More of This Pattern: {product.pattern.toLowerCase()}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cart Controls - Always at the bottom */}
        <div className="mt-4">
          {session?.user ? (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <QuantityInput
                  onQuantityChange={setQuantity}
                  initialQuantity={1}
                  className="w-full"
                  preventPropagation={true}
                />
              </div>
              <button
                onClick={handleAddToCart}
                className="flex-shrink-0 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                Add to Cart
              </button>
            </div>
          ) : (
            <div className="text-center">
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-800 text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                Login to purchase
              </Link>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
