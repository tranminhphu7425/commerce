"use client";

import clsx from "clsx";
import Image from "next/image";
import Label from "../label";
import { useCachedImageUrl, getImageCache } from "lib/local/image-cache";
import { useState } from "react";

export function GridTileImage({
  isInteractive = true,
  active,
  label,
  size,
  discountPercent,
  ...props
}: {
  isInteractive?: boolean;
  active?: boolean;
  label?: {
    title: string | React.ReactNode;
    amount: string;
    size?: string;
    currencyCode: string;
    position?: "bottom" | "center";
    compareAtAmount?: string;
  };
  discountPercent?: number;
  size?: string;
} & React.ComponentProps<typeof Image>) {
  const originalSrc = typeof props.src === "string" ? props.src : "";
  const cachedUrl = useCachedImageUrl(originalSrc);
  const [fallbackSrc, setFallbackSrc] = useState<string | null>(null);

  const finalSrc = fallbackSrc || cachedUrl || props.src;

  return (
    <div
      className={clsx(
        "group relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl border bg-white transition-all duration-300 dark:bg-neutral-900",
        {
          "border-orange-500 ring-1 ring-orange-500 shadow-md": active,
          "border-neutral-200 hover:border-orange-500/50 hover:shadow-lg dark:border-neutral-800 dark:hover:border-orange-500/50": !active,
        },
      )}
    >
      {discountPercent && discountPercent > 0 ? (
        <div className="absolute left-3 top-3 z-20 rounded-md bg-red-500 px-2 py-1 text-[11px] font-bold text-white shadow-md">
          -{discountPercent}%
        </div>
      ) : null}
      {props.src ? (
        <div className="relative h-full w-full overflow-hidden bg-neutral-50/30 dark:bg-neutral-950/20 flex items-center justify-center p-2">
          <Image
            className={clsx("h-full w-full object-contain", {
              "transition-transform duration-500 ease-out group-hover:scale-108":
                isInteractive,
            })}
            {...props}
            src={finalSrc}
            onError={(e) => {
              const cached = getImageCache(originalSrc);
              if (cached && fallbackSrc !== cached) {
                setFallbackSrc(cached);
              }
              if (props.onError) {
                props.onError(e);
              }
            }}
          />
        </div>
      ) : null}
      {label ? (
        <Label
          size={size}
          title={label.title}
          amount={label.amount}
          currencyCode={label.currencyCode}
          position={label.position}
          compareAtAmount={label.compareAtAmount}
        />
      ) : null}
    </div>
  );
}
