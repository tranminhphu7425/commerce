"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import type { Product, Image } from "lib/local/types";
import { getCheapestVariantDiscount } from "lib/local/discount";
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

  // Client-side states for instant UX
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  // Initialize options and image from URL on mount, or fallback to first variant
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const initialOpts: Record<string, string> = {};

    currentProduct.options.forEach((opt) => {
      const nameLower = opt.name.toLowerCase();
      const val = params.get(nameLower);
      if (val && opt.values.includes(val)) {
        initialOpts[nameLower] = val;
      }
    });

    // Default missing options to the first variant's selected options
    const missingOptions = currentProduct.options.some(
      (opt) => !initialOpts[opt.name.toLowerCase()]
    );
    if (missingOptions && currentProduct.variants.length > 0) {
      const firstVariant = currentProduct.variants[0];
      firstVariant?.selectedOptions.forEach((opt) => {
        const nameLower = opt.name.toLowerCase();
        if (!initialOpts[nameLower]) {
          initialOpts[nameLower] = opt.value;
        }
      });
    }

    setSelectedOptions(initialOpts);

    // Initial image index
    const imgParam = params.get("image");
    if (imgParam) {
      const idx = parseInt(imgParam, 10);
      if (!isNaN(idx) && idx >= 0 && idx < currentProduct.images.length) {
        setSelectedImageIndex(idx);
        return;
      }
    }

    // Default image index from selected variant
    if (currentProduct.variants.length > 0) {
      const activeVariant = currentProduct.variants.find((v) =>
        v.selectedOptions.every(
          (o) => o.value === initialOpts[o.name.toLowerCase()]
        )
      );
      if (activeVariant) {
        const variantImageIndex = currentProduct.images.findIndex(
          (img) => img.url === activeVariant.images?.[0]?.url || img.url === activeVariant.image?.url
        );
        if (variantImageIndex !== -1) {
          setSelectedImageIndex(variantImageIndex);
          return;
        }
      }
    }
    setSelectedImageIndex(0);
  }, [currentProduct]);

  // Helper to update the browser URL search params without triggering RSC load
  const updateUrl = (options: Record<string, string>, imageIndex?: number | null) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    Object.entries(options).forEach(([k, v]) => {
      params.set(k, v);
    });
    if (imageIndex !== undefined && imageIndex !== null && imageIndex !== 0) {
      params.set("image", imageIndex.toString());
    }
    const queryString = params.toString();
    const newUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ""}`;
    window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, "", newUrl);
  };

  const handleVariantChange = (name: string, value: string) => {
    const newOpts = {
      ...selectedOptions,
      [name]: value,
    };
    setSelectedOptions(newOpts);

    // Auto switch gallery image to variant's image if available
    const activeVariant = currentProduct.variants.find((v) =>
      v.selectedOptions.every(
        (o) => o.value === newOpts[o.name.toLowerCase()]
      )
    );
    let newImageIndex = selectedImageIndex;
    if (activeVariant) {
      const variantImageIndex = currentProduct.images.findIndex(
        (img) => img.url === activeVariant.images?.[0]?.url || img.url === activeVariant.image?.url
      );
      if (variantImageIndex !== -1) {
        setSelectedImageIndex(variantImageIndex);
        newImageIndex = variantImageIndex;
      }
    }

    updateUrl(newOpts, newImageIndex);
  };

  const handleImageChange = (index: number) => {
    setSelectedImageIndex(index);
    updateUrl(selectedOptions, index);
  };

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
              selectedImageIndex={selectedImageIndex}
              onImageChange={handleImageChange}
              selectedOptions={selectedOptions}
            />
          </Suspense>
        </div>

        <div className="basis-full lg:basis-2/6">
          <Suspense fallback={null}>
            <ProductDescription
              product={currentProduct}
              selectedOptions={selectedOptions}
              onOptionChange={handleVariantChange}
            />
          </Suspense>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="py-8">
          <h2 className="mb-4 text-2xl font-bold">Sản phẩm liên quan</h2>
          <ul className="flex w-full gap-4 overflow-x-auto pt-1">
            {relatedProducts.map((product) => {
              const { discountPercent, minPrice, compareAtAmount } = getCheapestVariantDiscount(product);
              return (
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
                        amount: minPrice,
                        currencyCode: product.priceRange.minVariantPrice.currencyCode,
                        compareAtAmount: compareAtAmount,
                      }}
                      discountPercent={discountPercent}
                      src={product.featuredImage?.url}
                      fill
                      sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, (min-width: 475px) 50vw, 100vw"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
