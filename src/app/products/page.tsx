"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FilterSidebar from "@/components/products/FilterSidebar";
import ProductCard from "@/components/products/ProductCard";
import SortOptions from "@/components/products/SortOptions";
import Link from "next/link";
import { useSearch } from "@/contexts/SearchContext";

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
  images: { src: string }[];
}

interface PaginationInfo {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

interface SortOptions {
  categories: string[];
  manufacturers: string[];
  patterns: string[];
  collections: string[];
  hasStockItems: boolean;
  hasQuickShip: boolean;
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsContent key="products-content" />
    </Suspense>
  );
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    categories: [],
    manufacturers: [],
    patterns: [],
    collections: [],
    hasStockItems: false,
    hasQuickShip: false,
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    pageSize: 24,
    totalPages: 0,
    hasMore: false,
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { isSearchVisible } = useSearch();

  // Track selected filters from URL params
  const selectedCategories =
    searchParams.get("category")?.split(",").filter(Boolean) || [];
  const selectedManufacturers =
    searchParams.get("manufacturer")?.split(",").filter(Boolean) || [];
  const selectedPatterns =
    searchParams.get("pattern")?.split(",").filter(Boolean) || [];
  const selectedTags =
    searchParams.get("tags")?.split(",").filter(Boolean) || [];

  // Fetch products with current filters and pagination
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Build query string from all search params
        const queryString = searchParams.toString();
        const response = await fetch(`/api/products?${queryString}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch products");
        }

        setProducts(data.products);
        setPagination(data.pagination);

        // Update filter options if provided
        if (data.filters) {
          setSortOptions((prev) => ({
            ...prev,
            categories: Array.from(
              new Set([
                ...prev.categories,
                ...(data.filters.appliedCategories || []),
              ])
            ),
            manufacturers: Array.from(
              new Set([
                ...prev.manufacturers,
                ...(data.filters.appliedManufacturers || []),
              ])
            ),
            patterns: Array.from(
              new Set([
                ...prev.patterns,
                ...(data.filters.appliedPatterns || []).map((p: string) =>
                  p.replace("PATTERN_", "")
                ),
              ])
            ),
          }));
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  // Fetch initial filter options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch("/api/products/options");
        const data = await response.json();

        if (response.ok && data.success) {
          setSortOptions(data.options);
        }
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };

    fetchOptions();
  }, []);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/products?${params}`, { scroll: false });
  };

  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentCategories =
      params
        .get("category")
        ?.split(",")
        .map((c) => decodeURIComponent(c.trim()))
        .filter(Boolean) || [];

    // Normalize for comparison
    const normalizeCategory = (str: string) => str.trim();
    const normalizedCategory = normalizeCategory(category);

    let newCategories;
    if (
      currentCategories.some((c) => normalizeCategory(c) === normalizedCategory)
    ) {
      newCategories = currentCategories.filter(
        (c) => normalizeCategory(c) !== normalizedCategory
      );
    } else {
      newCategories = [...new Set([...currentCategories, category])];
    }

    if (newCategories.length > 0) {
      params.set(
        "category",
        newCategories.map((c) => encodeURIComponent(c)).join(",")
      );
    } else {
      params.delete("category");
    }

    // Reset to first page when filter changes
    params.set("page", "1");
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  const handleManufacturerChange = (manufacturer: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentManufacturers =
      params
        .get("manufacturer")
        ?.split(",")
        .map((m) => decodeURIComponent(m))
        .filter(Boolean) || [];

    // Normalize the manufacturer name for comparison
    const normalizeString = (str: string) => str.trim();
    const normalizedManufacturer = normalizeString(manufacturer);

    // Check if the manufacturer is already selected (exact match)
    const isSelected = currentManufacturers.some(
      (m) => normalizeString(m) === normalizedManufacturer
    );

    let newManufacturers;
    if (isSelected) {
      newManufacturers = currentManufacturers.filter(
        (m) => normalizeString(m) !== normalizedManufacturer
      );
    } else {
      // Use the original manufacturer name when adding
      newManufacturers = [...new Set([...currentManufacturers, manufacturer])];
    }

    if (newManufacturers.length > 0) {
      params.set(
        "manufacturer",
        newManufacturers.map((m) => encodeURIComponent(m)).join(",")
      );
    } else {
      params.delete("manufacturer");
    }

    params.set("page", "1");
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  const handlePatternChange = (pattern: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentPatterns =
      params.get("pattern")?.split(",").filter(Boolean) || [];

    let newPatterns;
    if (currentPatterns.includes(pattern)) {
      newPatterns = currentPatterns.filter((p) => p !== pattern);
    } else {
      newPatterns = [...currentPatterns, pattern];
    }

    if (newPatterns.length > 0) {
      params.set("pattern", newPatterns.join(","));
    } else {
      params.delete("pattern");
    }

    // Reset to first page when filter changes
    params.set("page", "1");
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  const handleTagChange = (tag: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentTags = params.get("tags")?.split(",").filter(Boolean) || [];

    let newTags;
    if (currentTags.includes(tag)) {
      newTags = currentTags.filter((t) => t !== tag);
    } else {
      newTags = [...currentTags, tag];
    }

    if (newTags.length > 0) {
      params.set("tags", newTags.join(","));
    } else {
      params.delete("tags");
    }

    // Reset to first page when filter changes
    params.set("page", "1");
    router.push(`/products?${params}`, { scroll: false });
  };

  const clearAllFilters = () => {
    router.push("/products", { scroll: false });
  };

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  return (
    <div className="min-h-screen bg-white" key="products-page-container">
      <div className="max-w-7xl mx-auto px-4 w-full overflow-hidden">
        {/* Breadcrumb */}
        <nav className="flex py-4 text-sm">
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-900"
            key="home-link"
          >
            Home
          </Link>
          <span className="mx-2 text-gray-600" key="separator">
            /
          </span>
          <span className="text-gray-900 font-medium" key="products-label">
            Products
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 w-full overflow-hidden">
          {/* Left Sidebar */}
          <FilterSidebar
            key="filter-sidebar"
            sortOptions={sortOptions}
            selectedCategories={selectedCategories}
            selectedManufacturers={selectedManufacturers}
            selectedPatterns={selectedPatterns}
            selectedTags={selectedTags}
            onCategoryChange={handleCategoryChange}
            onManufacturerChange={handleManufacturerChange}
            onPatternChange={handlePatternChange}
            onTagChange={handleTagChange}
            onClearAll={clearAllFilters}
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
          />

          {/* Main Content */}
          <div className="flex-1 min-h-0 max-w-full overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">All Products</h1>
              {!loading && (
                <div className="text-sm text-gray-900">
                  {pagination.total} Products
                </div>
              )}
            </div>

            {/* Products Grid */}
            <div className="min-h-screen max-w-full overflow-hidden">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-black"></div>
                </div>
              ) : (
                <div
                  key="products-grid"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8"
                  style={{
                    width: "100%",
                    maxWidth: "100%",
                    overflow: "hidden",
                  }}
                >
                  {products.map((product, index) => (
                    <ProductCard
                      key={`${product.id}-${index}`}
                      product={product}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!loading && pagination.totalPages > 1 && (
                <div className="mt-8 mb-4 flex justify-center">
                  <nav className="flex items-center gap-1">
                    {/* Previous button */}
                    <button
                      key="prev-button"
                      onClick={() =>
                        handlePageChange(Math.max(1, pagination.page - 1))
                      }
                      disabled={pagination.page === 1}
                      className={`px-2 py-1 rounded border ${
                        pagination.page === 1
                          ? "border-gray-200 text-gray-400 cursor-not-allowed"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      ‹
                    </button>

                    {/* Page numbers */}
                    {Array.from(
                      { length: pagination.totalPages },
                      (_, i) => i + 1
                    ).map((page) => (
                      <button
                        key={`page-${page}`}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 rounded border ${
                          page === pagination.page
                            ? "bg-zinc-900 text-white border-zinc-900"
                            : "border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    {/* Next button */}
                    <button
                      key="next-button"
                      onClick={() =>
                        handlePageChange(
                          Math.min(pagination.totalPages, pagination.page + 1)
                        )
                      }
                      disabled={pagination.page === pagination.totalPages}
                      className={`px-2 py-1 rounded border ${
                        pagination.page === pagination.totalPages
                          ? "border-gray-200 text-gray-400 cursor-not-allowed"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      ›
                    </button>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Filter Button */}
        <button
          onClick={toggleFilter}
          className={`fixed right-4 z-30 md:hidden flex items-center gap-2 px-4 py-3 bg-copper text-white border border-copper rounded-full shadow-lg hover:bg-copper-hover ${
            isSearchVisible ? "top-[150px]" : "top-[100px]"
          } transition-all duration-300 ease-in-out`}
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
      </div>
    </div>
  );
}
