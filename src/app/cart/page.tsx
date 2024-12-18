/* eslint-disable @next/next/no-img-element */
"use client";

import { useCart } from "@/contexts/CartContext";
import { useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import QuantityInput from "@/components/products/QuantityInput";

export default function CartPage() {
  const { data: session } = useSession();
  const { items, removeItem, updateQuantity, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmitOrder = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/cart/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          email: session?.user?.email,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit order");
      }

      setSuccess(true);
      clearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded">
          Please log in to view your cart
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6 text-gray-900">
            Order Submitted
          </h1>
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded mb-4">
            Your order has been submitted successfully! Our sales team will
            contact you shortly.
          </div>
          <Link
            href="/products"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <span>Continue Shopping</span>
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Your Cart</h1>

        {items.length === 0 ? (
          <div className="text-gray-500">
            Your cart is empty.{" "}
            <Link
              href="/products"
              className="text-blue-600 hover:text-blue-800"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Manufacturer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      UOM
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-16 w-16">
                          {item.imageSrc ? (
                            <img
                              src={item.imageSrc}
                              alt={item.title}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                              <span className="text-gray-400">No image</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          SKU: {item.sku}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.manufacturer || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.uom || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <QuantityInput
                          onQuantityChange={(quantity) =>
                            updateQuantity(item.id, quantity)
                          }
                          initialQuantity={item.quantity}
                          min={1}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded">{error}</div>
            )}

            <div className="flex justify-between items-center">
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-900 text-sm"
              >
                Clear Cart
              </button>
              <div className="flex gap-4">
                <Link
                  href="/products"
                  className="bg-gray-100 text-gray-800 px-6 py-2 rounded hover:bg-gray-200 text-sm"
                >
                  Continue Shopping
                </Link>
                <button
                  onClick={handleSubmitOrder}
                  disabled={submitting}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  {submitting ? "Submitting..." : "Submit Order"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}