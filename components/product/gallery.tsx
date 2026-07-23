"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { GridTileImage } from "components/grid/tile";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCachedImageUrl, getImageCache } from "lib/local/image-cache";
import { useState } from "react";
import type { ProductVariant } from "lib/local/types";

export function Gallery({
  images,
  variants,
  selectedImageIndex,
  onImageChange,
  selectedOptions,
}: {
  images: { src: string; altText: string }[];
  variants?: ProductVariant[];
  selectedImageIndex?: number;
  onImageChange?: (index: number) => void;
  selectedOptions?: Record<string, string>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fallbackSrc, setFallbackSrc] = useState<string | null>(null);

  let imageIndex = 0;
  if (selectedImageIndex !== undefined) {
    imageIndex = selectedImageIndex;
  } else if (searchParams.has("image")) {
    imageIndex = parseInt(searchParams.get("image")!);
  } else if (variants && variants.length > 0) {
    const variant = variants.find((variant: ProductVariant) =>
      variant.selectedOptions.every((option) => {
        const val = selectedOptions
          ? selectedOptions[option.name.toLowerCase()]
          : searchParams.get(option.name.toLowerCase());
        return option.value === val;
      }),
    );
    if (variant?.images && variant.images.length > 0) {
      const variantImageIndex = images.findIndex((img) => img.src === variant.images?.[0]?.url);
      if (variantImageIndex !== -1) {
        imageIndex = variantImageIndex;
      }
    } else if (variant?.image) {
      const variantImageIndex = images.findIndex((img) => img.src === variant.image?.url);
      if (variantImageIndex !== -1) {
        imageIndex = variantImageIndex;
      }
    }
  }

  const currentImageSrc = images[imageIndex]?.src || "";
  const cachedUrl = useCachedImageUrl(currentImageSrc);
  const mainImageSrc = fallbackSrc || cachedUrl || currentImageSrc;

  const updateImage = (index: string) => {
    if (onImageChange) {
      onImageChange(parseInt(index, 10));
    } else {
      setFallbackSrc(null);
      const params = new URLSearchParams(searchParams.toString());
      params.set("image", index);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  };

  const nextImageIndex = imageIndex + 1 < images.length ? imageIndex + 1 : 0;
  const previousImageIndex =
    imageIndex === 0 ? images.length - 1 : imageIndex - 1;

  const buttonClassName =
    "h-full px-6 transition-all ease-in-out hover:scale-110 hover:text-black dark:hover:text-white flex items-center justify-center";

  return (
    <form>
      <div className="relative aspect-square h-full max-h-[550px] w-full overflow-hidden">
        {images[imageIndex] && (
          <Image
            className="h-full w-full object-contain"
            fill
            sizes="(min-width: 1024px) 66vw, 100vw"
            alt={images[imageIndex]?.altText as string}
            src={mainImageSrc}
            priority={true}
            onError={() => {
              const cached = getImageCache(currentImageSrc);
              if (cached && fallbackSrc !== cached) {
                setFallbackSrc(cached);
              }
            }}
          />
        )}

        {images.length > 1 ? (
          <div className="absolute bottom-[15%] flex w-full justify-center">
            <div className="mx-auto flex h-11 items-center rounded-full border border-white bg-neutral-50/80 text-neutral-700 backdrop-blur-sm dark:border-black dark:bg-neutral-900/80">
              <button
                type="button"
                onClick={() => updateImage(previousImageIndex.toString())}
                aria-label="Previous product image"
                className={buttonClassName}
              >
                <ArrowLeftIcon className="h-5" />
              </button>
              <div className="mx-1 h-6 w-px bg-neutral-500"></div>
              <button
                type="button"
                onClick={() => updateImage(nextImageIndex.toString())}
                aria-label="Next product image"
                className={buttonClassName}
              >
                <ArrowRightIcon className="h-5" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {images.length > 1 ? (
        <ul className="my-12 flex items-center flex-wrap justify-center gap-2 overflow-auto py-1 lg:mb-0">
          {images.map((image, index) => {
            const isActive = index === imageIndex;

            return (
              <li key={image.src} className="h-20 w-20">
                <button
                  type="button"
                  onClick={() => updateImage(index.toString())}
                  aria-label="Select product image"
                  className="h-full w-full"
                >
                  <GridTileImage
                    alt={image.altText}
                    src={image.src}
                    width={80}
                    height={80}
                    active={isActive}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </form>
  );
}
