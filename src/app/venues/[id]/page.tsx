/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useCart } from "@/contexts/CartContext";
import QuantityInput from "@/components/products/QuantityInput";
import VenueFilterSidebar from "@/components/venues/VenueFilterSidebar";
import Link from "next/link";

interface VenueProduct {
  id: string;
  sku: string;
  title: string;
  manufacturer: string | null;
  category: string | null;
  uom: string | null;
  qtyAvailable: number | null;
  price: number | null;
  images: { src: string }[];
  tags: string | null;
}

interface VenueProductsResponse {
  success: boolean;
  error?: string;
  venueName: string;
  products: {
    id: bigint | number;
    sku: string;
    title: string;
    manufacturer: string | null;
    category: string | null;
    uom: string | null;
    qtyAvailable: bigint | number | null;
    price: number | null;
    images: { src: string }[];
    tags: string | null;
  }[];
}

interface Venue {
  id: string;
  venueName: string;
  products: VenueProduct[];
}

export default function VenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { data: session } = useSession();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const { addItem } = useCart();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>(
    []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchVenueProducts = async () => {
      try {
        const response = await fetch(
          `/api/venue-products?trx_venue_id=${resolvedParams.id}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch venue products");
        }
        const data = (await response.json()) as VenueProductsResponse;
        if (data.success) {
          console.log(
            "First product image URL:",
            data.products[0]?.images[0]?.src
          );
          setVenue({
            id: resolvedParams.id,
            venueName: data.venueName,
            products: data.products.map((product) => ({
              ...product,
              id: String(product.id),
              qtyAvailable: product.qtyAvailable
                ? Number(product.qtyAvailable)
                : null,
            })),
          });
        } else {
          throw new Error(data.error || "Failed to fetch venue products");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchVenueProducts();
    }
  }, [resolvedParams.id, session]);

  const handleQuantityChange = (productId: string, quantity: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: quantity,
    }));
  };

  const handleAddToCart = (product: VenueProduct) => {
    const quantity = quantities[product.id] || 1;
    addItem(
      {
        id: product.id,
        sku: product.sku,
        title: product.title,
        manufacturer: product.manufacturer,
        category: product.category,
        uom: product.uom,
        imageSrc: product.images[0]?.src,
      },
      quantity
    );
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleManufacturerChange = (manufacturer: string) => {
    setSelectedManufacturers((prev) =>
      prev.includes(manufacturer)
        ? prev.filter((m) => m !== manufacturer)
        : [...prev, manufacturer]
    );
  };

  const handleTagChange = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleClearAll = () => {
    setSelectedCategories([]);
    setSelectedManufacturers([]);
    setSelectedTags([]);
  };

  const getSortOptions = (products: VenueProduct[]) => {
    const categories = new Set<string>();
    const manufacturers = new Set<string>();
    const patterns = new Set<string>();
    const collections = new Set<string>();
    const otherTags = new Set<string>();

    // Process tags
    products.forEach((product) => {
      if (product.category) categories.add(product.category);
      if (product.manufacturer) manufacturers.add(product.manufacturer);
      const tags = product.tags?.split(",").map((t) => t.trim()) || [];
      tags.forEach((tag) => {
        if (tag.startsWith("PATTERN_")) {
          patterns.add(tag.replace("PATTERN_", ""));
        } else if (tag.startsWith("AQCAT_")) {
          collections.add(tag.replace("AQCAT_", ""));
        } else {
          otherTags.add(tag);
        }
      });
    });

    return {
      categories: Array.from(categories).sort(),
      manufacturers: Array.from(manufacturers).sort(),
      tags: Array.from(otherTags).sort(),
      patterns: Array.from(patterns).sort(),
      collections: Array.from(collections).sort(),
      hasStockItems: products.some((p) =>
        p.tags?.includes("Stock Item / Quick Ship")
      ),
    };
  };

  const filteredProducts =
    venue?.products.filter((product) => {
      const searchMatch =
        !searchTerm ||
        Object.values(product).some((value) =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(product.category || "");

      const matchesManufacturer =
        selectedManufacturers.length === 0 ||
        selectedManufacturers.includes(product.manufacturer || "");

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some((tag) => product.tags?.includes(tag));

      return (
        searchMatch && matchesCategory && matchesManufacturer && matchesTags
      );
    }) || [];

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-600 p-4 rounded">{error}</div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 text-yellow-600 p-4 rounded">
          No venue found
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header with venue name */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {venue.venueName} Products
          </h1>
        </div>

        {/* Filter Button (Mobile & Desktop) */}
        <button
          onClick={toggleFilter}
          className="fixed top-[110px] md:top-[180px] right-4 flex items-center gap-2 px-4 py-3 bg-copper text-white border border-copper shadow-lg hover:bg-copper-hover transition-colors md:py-2 md:rounded-lg rounded-full"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <span className="text-sm font-medium">Filter</span>
        </button>

        {/* Add Catalog Reference Message */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="text-blue-800">
            <Link
              href="/products"
              className="text-blue-600 hover:text-blue-800 font-medium underline"
            >
              CLICK HERE
            </Link>{" "}
            TO ADD UNPRICED ITEMS FROM OUR MAIN CATALOG TO YOUR ORDER TO RECEIVE
            A QUOTE .
          </p>
        </div>

        {/* Filter Sidebar */}
        <VenueFilterSidebar
          sortOptions={getSortOptions(venue.products)}
          selectedCategories={selectedCategories}
          selectedManufacturers={selectedManufacturers}
          selectedTags={selectedTags}
          onCategoryChange={handleCategoryChange}
          onManufacturerChange={handleManufacturerChange}
          onTagChange={handleTagChange}
          onClearAll={handleClearAll}
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        {/* Products Grid */}
        <div className="flex-1">
          {/* Desktop Table / Mobile Cards */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            {/* Desktop Table - Hidden on Mobile */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Manufacturer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      UOM
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty Available
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative h-20 w-20">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0].src}
                              alt={product.title}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <img
                              src="/noImageState.jpg"
                              alt="No image available"
                              className="h-full w-full object-contain"
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.manufacturer || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.uom || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.qtyAvailable || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.price ? `$${product.price.toFixed(2)}` : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {session?.user && (
                          <div className="flex items-center gap-2">
                            <QuantityInput
                              onQuantityChange={(quantity) =>
                                handleQuantityChange(product.id, quantity)
                              }
                              initialQuantity={quantities[product.id] || 1}
                              max={product.qtyAvailable || 9999}
                            />
                            <button
                              onClick={() => handleAddToCart(product)}
                              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                            >
                              Add
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border rounded-lg p-4 space-y-3"
                >
                  {/* Product Header */}
                  <div className="flex gap-4">
                    <div className="relative h-20 w-20 flex-shrink-0">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0].src}
                          alt={product.title}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <img
                          src="/noImageState.jpg"
                          alt="No image available"
                          className="h-full w-full object-contain"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {product.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        SKU: {product.sku}
                      </p>
                      {product.manufacturer && (
                        <p className="text-sm text-gray-500">
                          {product.manufacturer}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">UOM:</span>{" "}
                      <span className="text-gray-900">
                        {product.uom || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Available:</span>{" "}
                      <span className="text-gray-900">
                        {product.qtyAvailable || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Price:</span>{" "}
                      <span className="text-gray-900">
                        {product.price ? `$${product.price.toFixed(2)}` : "-"}
                      </span>
                    </div>
                  </div>

                  {/* Add to Cart Section */}
                  {session?.user && (
                    <div className="flex items-center gap-2 pt-2">
                      <div className="flex-1">
                        <QuantityInput
                          onQuantityChange={(quantity) =>
                            handleQuantityChange(product.id, quantity)
                          }
                          initialQuantity={quantities[product.id] || 1}
                          max={product.qtyAvailable || 9999}
                        />
                      </div>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap text-sm font-medium"
                      >
                        Add to Cart
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
