"use client";

import type { Product } from "lib/local/types";
import { getCheapestVariantDiscount } from "lib/local/discount";
import { useDynamicProducts } from "lib/local/client-store";
import Link from "next/link";
import { GridTileImage } from "./grid/tile";

export function Carousel({ initialProducts = [] }: { initialProducts?: Product[] }) {
  const dynamicProducts = useDynamicProducts(initialProducts);

  const featuredProducts = dynamicProducts.filter((p) =>
    ((p as any).collections || []).includes("featured")
  );

  const products = featuredProducts.length > 0 ? featuredProducts : dynamicProducts;

  if (!products?.length) return null;

  // Purposefully duplicating products to make the carousel loop and not run out of products on wide screens.
  const carouselProducts = [...products, ...products, ...products];

  return (
    <div className="w-full overflow-x-auto pb-6 pt-1">
      <ul className="flex animate-carousel gap-4">
        {carouselProducts.map((product, i) => {
          const { discountPercent, minPrice, compareAtAmount } = getCheapestVariantDiscount(product);
          return (
            <li
              key={`${product.handle}${i}`}
              className="relative aspect-square h-[30vh] max-h-[275px] w-2/3 max-w-[475px] flex-none md:w-1/3"
            >
              <Link
                href={`/product/${product.handle}`}
                className="relative h-full w-full"
              >
                <GridTileImage
                  alt={product.title}
                  label={{
                    title: product.title,
                    amount: minPrice,
                    currencyCode: product.priceRange.minVariantPrice.currencyCode,
                    compareAtAmount: compareAtAmount,
                  }}
                  discountPercent={discountPercent}
                  src={product.featuredImage?.url}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
