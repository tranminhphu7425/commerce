"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Product } from "lib/local/types";
import { sorting, defaultSort } from "lib/constants";
import { useDynamicProducts } from "lib/local/client-store";
import ProductGridItems from "./product-grid-items";
import Grid from "components/grid";
import { createUrl } from "lib/utils";

const PRODUCTS_PER_PAGE = 9;

export default function SortableProductList({ products }: { products: Product[] }) {
  const dynamicProducts = useDynamicProducts(products);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listRef = useRef<HTMLDivElement>(null);

  const sort = searchParams.get("sort");
  const query = searchParams.get("q");
  const minPriceParam = searchParams.get("minPrice");
  const maxPriceParam = searchParams.get("maxPrice");
  const pageParam = searchParams.get("page");

  const page = pageParam ? parseInt(pageParam, 10) : 1;
  const minPrice = minPriceParam ? parseFloat(minPriceParam) : undefined;
  const maxPrice = maxPriceParam ? parseFloat(maxPriceParam) : undefined;

  const [minInput, setMinInput] = useState(minPriceParam || "");
  const [maxInput, setMaxInput] = useState(maxPriceParam || "");

  // Synchronize inputs with URL changes
  useEffect(() => {
    setMinInput(minPriceParam || "");
    setMaxInput(maxPriceParam || "");
  }, [minPriceParam, maxPriceParam]);

  const { sortKey, reverse } = sorting.find((item) => item.slug === sort) || defaultSort;

  let processedProducts = [...dynamicProducts];

  // 1. Client-side filtering for search query
  if (query) {
    const q = query.toLowerCase();
    processedProducts = processedProducts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  // 2. Client-side filtering for price range
  if (minPrice !== undefined) {
    processedProducts = processedProducts.filter(
      (p) => Number(p.priceRange.minVariantPrice.amount) >= minPrice
    );
  }
  if (maxPrice !== undefined) {
    processedProducts = processedProducts.filter(
      (p) => Number(p.priceRange.minVariantPrice.amount) <= maxPrice
    );
  }

  // 3. Client-side sorting
  processedProducts.sort((a, b) => {
    if (sortKey === "PRICE") {
      const priceA = Number(a.priceRange.minVariantPrice.amount);
      const priceB = Number(b.priceRange.minVariantPrice.amount);
      return reverse ? priceB - priceA : priceA - priceB;
    }
    if (sortKey === "CREATED_AT") {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return reverse ? dateB - dateA : dateA - dateB;
    }
    return 0;
  });

  // 4. Client-side pagination
  const totalProducts = processedProducts.length;
  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);
  const currentPage = Math.min(Math.max(1, page), Math.max(1, totalPages));
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = Math.min(startIndex + PRODUCTS_PER_PAGE, totalProducts);
  const paginatedProducts = processedProducts.slice(startIndex, endIndex);

  const setFilterParams = (paramsToUpdate: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    Object.entries(paramsToUpdate).forEach(([key, value]) => {
      if (value === null) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    });
    // Reset page to 1 on filter changes, unless page is explicitly set
    if (!paramsToUpdate.hasOwnProperty("page")) {
      nextParams.delete("page");
    }
    router.push(createUrl(pathname, nextParams), { scroll: false });
    
    // Smooth scroll list container into view
    if (listRef.current) {
      listRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handlePresetClick = (min: string | null, max: string | null) => {
    setFilterParams({
      minPrice: min,
      maxPrice: max,
    });
  };

  const handleCustomPriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilterParams({
      minPrice: minInput.trim() || null,
      maxPrice: maxInput.trim() || null,
    });
  };

  const handleClearFilters = () => {
    setFilterParams({
      minPrice: null,
      maxPrice: null,
    });
  };

  const isFiltered = !!(minPriceParam || maxPriceParam);

  const presets = [
    { label: "Tất cả", min: null, max: null, active: !minPriceParam && !maxPriceParam },
    { label: "Dưới 200.000₫", min: null, max: "200000", active: !minPriceParam && maxPriceParam === "200000" },
    { label: "200.000₫ - 500.000₫", min: "200000", max: "500000", active: minPriceParam === "200000" && maxPriceParam === "500000" },
    { label: "Trên 500.000₫", min: "500000", max: null, active: minPriceParam === "500000" && !maxPriceParam },
  ];

  return (
    <div ref={listRef} className="scroll-mt-24">
      {/* Horizontal Price Filter Bar */}
      <div className="mb-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Khoảng giá:</span>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePresetClick(preset.min, preset.max)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    preset.active
                      ? "bg-orange-600 text-white shadow-md shadow-orange-600/10"
                      : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Range Input Form */}
          <form onSubmit={handleCustomPriceSubmit} className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Tùy chọn (₫):</span>
            <input
              type="number"
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
              placeholder="Từ giá"
              className="w-24 px-2.5 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-orange-600"
            />
            <span className="text-neutral-400 text-xs">-</span>
            <input
              type="number"
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              placeholder="Đến giá"
              className="w-24 px-2.5 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-orange-600"
            />
            <button
              type="submit"
              className="bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-white text-xs font-semibold px-3 py-1.5 rounded-lg active:scale-95 transition-all shadow-sm"
            >
              Áp dụng
            </button>
            {isFiltered && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs text-red-600 hover:text-red-700 font-semibold transition-colors ml-2"
              >
                Xóa bộ lọc
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Product Grid Items */}
      {paginatedProducts.length > 0 ? (
        <>
          <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <ProductGridItems products={paginatedProducts} query={query} />
          </Grid>

          {/* Pagination UI */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-neutral-200 dark:border-neutral-800 pt-6 sm:flex-row">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Hiển thị <strong className="font-semibold text-neutral-900 dark:text-neutral-100">{startIndex + 1} - {endIndex}</strong> trên tổng số <strong className="font-semibold text-neutral-900 dark:text-neutral-100">{totalProducts}</strong> sản phẩm
              </span>

              <div className="flex items-center gap-1.5">
                {/* Prev Button */}
                <button
                  disabled={currentPage === 1}
                  onClick={() => setFilterParams({ page: String(currentPage - 1) })}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  ‹ Trước
                </button>

                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                  <button
                    key={pNum}
                    onClick={() => setFilterParams({ page: String(pNum) })}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      pNum === currentPage
                        ? "bg-orange-600 text-white shadow-md shadow-orange-600/10"
                        : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    }`}
                  >
                    {pNum}
                  </button>
                ))}

                {/* Next Button */}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setFilterParams({ page: String(currentPage + 1) })}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Sau ›
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="py-6 text-center text-neutral-500 dark:text-neutral-400">
          {query
            ? `Không tìm thấy kết quả nào cho "${query}"`
            : "Không tìm thấy sản phẩm nào phù hợp với bộ lọc."}
        </p>
      )}
    </div>
  );
}
