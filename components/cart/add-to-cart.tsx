"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Product, ProductVariant } from "lib/local/types";
import { useSearchParams } from "next/navigation";
import { useCart } from "./cart-context";

function SubmitButton({
  availableForSale,
  selectedVariantId,
  onClick
}: {
  availableForSale: boolean;
  selectedVariantId: string | undefined;
  onClick: () => void;
}) {
  const buttonClasses =
    "relative flex w-full items-center justify-center rounded-full bg-orange-600 p-4 tracking-wide text-white";
  const disabledClasses = "cursor-not-allowed opacity-60 hover:opacity-60";

  if (!availableForSale) {
    return (
      <button disabled className={clsx(buttonClasses, disabledClasses)}>
        Hết hàng
      </button>
    );
  }

  if (!selectedVariantId) {
    return (
      <button
        aria-label="Vui lòng chọn phân loại"
        disabled
        className={clsx(buttonClasses, disabledClasses)}
      >
        <div className="absolute left-0 ml-4">
          <PlusIcon className="h-5" />
        </div>
        Thêm vào giỏ
      </button>
    );
  }

  return (
    <button
      aria-label="Thêm vào giỏ"
      onClick={onClick}
      className={clsx(buttonClasses, {
        "hover:opacity-90": true,
      })}
    >
      <div className="absolute left-0 ml-4">
        <PlusIcon className="h-5" />
      </div>
      Thêm vào giỏ
    </button>
  );
}

export function AddToCart({
  product,
  selectedOptions,
}: {
  product: Product;
  selectedOptions?: Record<string, string>;
}) {
  const { variants } = product;
  const { addCartItem } = useCart();
  const searchParams = useSearchParams();

  const variant = variants.find((variant: ProductVariant) =>
    variant.selectedOptions.every((option) => {
      const val = selectedOptions
        ? selectedOptions[option.name.toLowerCase()]
        : searchParams.get(option.name.toLowerCase());
      return option.value === val;
    })
  );
  const defaultVariantId = variants.length === 1 ? variants[0]?.id : undefined;
  const selectedVariantId = variant?.id || defaultVariantId;
  const finalVariant = variants.find(
    (variant) => variant.id === selectedVariantId,
  )!;

  return (
    <SubmitButton
      availableForSale={product.availableForSale}
      selectedVariantId={selectedVariantId}
      onClick={() => addCartItem(finalVariant, product)}
    />
  );
}
