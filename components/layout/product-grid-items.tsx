import Grid from "components/grid";
import { GridTileImage } from "components/grid/tile";
import { Product } from "lib/local/types";
import { getCheapestVariantDiscount } from "lib/local/discount";
import Link from "next/link";
import React from "react";

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text: string, query: string | null | undefined): React.ReactNode {
  if (!query || !query.trim()) return text;

  const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark
            key={index}
            className="bg-yellow-200 dark:bg-yellow-800 text-black dark:text-white rounded-xs px-0.5 font-bold"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

function getDescriptionSnippet(description: string, query: string): string {
  if (!description || !query) return "";

  const cleanDescription = description.replace(/<[^>]*>/g, ""); // Strip HTML tags
  const index = cleanDescription.toLowerCase().indexOf(query.toLowerCase());

  if (index === -1) {
    return cleanDescription.length > 60 ? cleanDescription.substring(0, 60) + "..." : cleanDescription;
  }

  const start = Math.max(0, index - 25);
  const end = Math.min(cleanDescription.length, index + query.length + 35);

  let snippet = cleanDescription.substring(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < cleanDescription.length) snippet = snippet + "...";

  return snippet;
}

export default function ProductGridItems({
  products,
  query,
}: {
  products: Product[];
  query?: string | null;
}) {
  return (
    <>
      {products.map((product) => {
        const hasSnippet = query && product.description.toLowerCase().includes(query.toLowerCase());
        const { discountPercent, minPrice, compareAtAmount } = getCheapestVariantDiscount(product);

        return (
          <Grid.Item key={product.handle} className="animate-fadeIn">
            <Link
              className="relative inline-block h-full w-full group/link"
              href={`/product/${product.handle}`}
              prefetch={true}
            >
              <GridTileImage
                alt={product.title}
                label={{
                  title: highlightText(product.title, query),
                  amount: minPrice,
                  currencyCode: product.priceRange.minVariantPrice.currencyCode,
                  compareAtAmount: compareAtAmount,
                }}
                discountPercent={discountPercent}
                src={product.featuredImage?.url}
                fill
                sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
              />

             
            </Link>
          </Grid.Item>
        );
      })}
    </>
  );
}
