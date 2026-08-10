"use client";

import { GridTileImage } from "components/grid/tile";
import type { Product } from "lib/local/types";
import { getCheapestVariantDiscount } from "lib/local/discount";
import { useDynamicProducts } from "lib/local/client-store";
import Link from "next/link";

function ThreeItemGridItem({
  item,
  size,
  priority,
}: {
  item: Product;
  size: "full" | "half";
  priority?: boolean;
}) {
  const { discountPercent, minPrice, compareAtAmount } = getCheapestVariantDiscount(item);

  return (
    <div
      className={
        size === "full"
          ? "md:col-span-4 md:row-span-2"
          : "md:col-span-2 md:row-span-1"
      }
    >
      <Link
        className="relative block aspect-square h-full w-full"
        href={`/product/${item.handle}`}
        prefetch={true}
      >
        <GridTileImage
          src={item.featuredImage.url}
          fill
          size={size}
          sizes={
            size === "full"
              ? "(min-width: 768px) 66vw, 100vw"
              : "(min-width: 768px) 33vw, 100vw"
          }
          priority={priority}
          alt={item.title}
          label={{
            position: size === "full" ? "center" : "bottom",
            title: item.title as string,
            amount: minPrice,
            currencyCode: item.priceRange.minVariantPrice.currencyCode,
            compareAtAmount: compareAtAmount,
          }}
          discountPercent={discountPercent}
        />
      </Link>
    </div>
  );
}

export function ThreeItemGrid({ initialProducts = [] }: { initialProducts?: Product[] }) {
  const dynamicProducts = useDynamicProducts(initialProducts);

  // Filter products by collection "featured" or take top products
  const homepageItems = dynamicProducts.filter((p) =>
    ((p as any).collections || []).includes("featured")
  );

  const displayItems = homepageItems.length >= 3 ? homepageItems : dynamicProducts;

  if (!displayItems[0] || !displayItems[1] || !displayItems[2]) return null;

  const [firstProduct, secondProduct, thirdProduct] = displayItems;

  return (
    <section className="mx-auto max-w-(--breakpoint-2xl) px-4 pb-4">
      <h2 className="mb-6 text-2xl font-bold text-neutral-800 dark:text-white uppercase tracking-wider">
        Các sản phẩm nổi bật
      </h2>
      <div className="grid gap-4 md:grid-cols-6 md:grid-rows-2 lg:max-h-[calc(100vh-200px)]">
        <ThreeItemGridItem size="full" item={firstProduct!} priority={true} />
        <ThreeItemGridItem size="half" item={secondProduct!} priority={true} />
        <ThreeItemGridItem size="half" item={thirdProduct!} />
      </div>
    </section>
  );
}
