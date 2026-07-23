"use client";

import Price from "components/price";
import { Product, ProductVariant } from "lib/local/types";
import { useSearchParams } from "next/navigation";

export function ProductPrice({
  product,
  selectedOptions,
}: {
  product: Product;
  selectedOptions?: Record<string, string>;
}) {
  const searchParams = useSearchParams();
  const { variants } = product;

  const variant = variants.find((variant: ProductVariant) =>
    variant.selectedOptions.every((option) => {
      const val = selectedOptions
        ? selectedOptions[option.name.toLowerCase()]
        : searchParams.get(option.name.toLowerCase());
      return option.value === val;
    })
  );

  const defaultVariant = variants.length === 1 ? variants[0] : undefined;
  const selectedVariant = variant || defaultVariant;
  
  const amount = selectedVariant?.price.amount || product.priceRange.maxVariantPrice.amount;
  const currencyCode = selectedVariant?.price.currencyCode || product.priceRange.maxVariantPrice.currencyCode;
  
  const compareAtAmount = selectedVariant?.compareAtPrice?.amount;

  // Calculate discount percentage if applicable
  let discountPercentage = 0;
  if (compareAtAmount && parseFloat(compareAtAmount) > parseFloat(amount)) {
    const originalPrice = parseFloat(compareAtAmount);
    const salePrice = parseFloat(amount);
    discountPercentage = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="mr-auto flex w-auto items-center gap-2 rounded-full bg-orange-600 p-2 text-sm text-white">
        <Price
          amount={amount}
          currencyCode={currencyCode}
        />
        {discountPercentage > 0 && (
          <span className="ml-1 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-orange-600">
            -{discountPercentage}%
          </span>
        )}
      </div>
      
      {compareAtAmount && discountPercentage > 0 && (
        <div className="text-sm text-neutral-700 line-through dark:text-neutral-400">
          <Price amount={compareAtAmount} currencyCode={currencyCode} />
        </div>
      )}
    </div>
  );
}
