"use client";

import { useSearchParams } from "next/navigation";
import { Product } from "lib/local/types";
import { sorting, defaultSort } from "lib/constants";
import { useDynamicProducts } from "lib/local/client-store";
import ProductGridItems from "./product-grid-items";

export default function SortableProductList({ products }: { products: Product[] }) {
  const dynamicProducts = useDynamicProducts(products);
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort");
  const query = searchParams.get("q");
  const { sortKey, reverse } = sorting.find((item) => item.slug === sort) || defaultSort;

  let processedProducts = [...dynamicProducts];

  // Client-side filtering for search query
  if (query) {
    const q = query.toLowerCase();
    processedProducts = processedProducts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  // Client-side sorting
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

  return (
    <>
      {processedProducts.length > 0 ? (
        <ProductGridItems products={processedProducts} />
      ) : (
        <p className="py-3 text-lg">
          {query
            ? `Không tìm thấy kết quả nào cho "${query}"`
            : "Không tìm thấy sản phẩm nào."}
        </p>
      )}
    </>
  );
}
