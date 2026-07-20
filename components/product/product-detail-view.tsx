"use client";

import { Suspense } from "react";
import Link from "next/link";
import type { Product, Image } from "lib/local/types";
import { useDynamicProducts } from "lib/local/client-store";
import { Gallery } from "components/product/gallery";
import { ProductDescription } from "components/product/product-description";
import { GridTileImage } from "components/grid/tile";

export function ProductDetailView({
  initialProduct,
  handle,
}: {
  initialProduct: Product;
  handle: string;
}) {
  const dynamicProducts = useDynamicProducts([initialProduct]);
  const currentProduct =
    dynamicProducts.find((p) => p.handle === handle || p.id === initialProduct.id) ||
    initialProduct;

  const currentCollections = (currentProduct as any).collections || [];
  const relatedProducts = dynamicProducts
    .filter(
      (p) =>
        p.id !== currentProduct.id &&
        ((p as any).collections || []).some((c: string) =>
          currentCollections.includes(c)
        )
    )
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-(--breakpoint-2xl) px-4">
      <div className="flex flex-col rounded-lg border border-neutral-200 bg-white p-8 md:p-12 lg:flex-row lg:gap-8 dark:border-neutral-800 dark:bg-black">
        <div className="h-full w-full basis-full lg:basis-4/6">
          <Suspense
            fallback={
              <div className="relative aspect-square h-full max-h-[550px] w-full overflow-hidden" />
            }
          >
            <Gallery
              images={currentProduct.images.map((image: Image) => ({
                src: image.url,
                altText: image.altText,
              }))}
              variants={currentProduct.variants}
            />
          </Suspense>
        </div>

        <div className="basis-full lg:basis-2/6">
          <Suspense fallback={null}>
            <ProductDescription product={currentProduct} />
          </Suspense>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="py-8">
          <h2 className="mb-4 text-2xl font-bold">Sản phẩm liên quan</h2>
          <ul className="flex w-full gap-4 overflow-x-auto pt-1">
            {relatedProducts.map((product) => (
              <li
                key={product.handle}
                className="aspect-square w-full flex-none min-[475px]:w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5"
              >
                <Link
                  className="relative h-full w-full"
                  href={`/product/${product.handle}`}
                  prefetch={true}
                >
                  <GridTileImage
                    alt={product.title}
                    label={{
                      title: product.title,
                      amount: product.priceRange.maxVariantPrice.amount,
                      currencyCode: product.priceRange.maxVariantPrice.currencyCode,
                    }}
                    src={product.featuredImage?.url}
                    fill
                    sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, (min-width: 475px) 50vw, 100vw"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
