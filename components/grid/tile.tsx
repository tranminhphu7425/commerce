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
  ...props
}: {
  isInteractive?: boolean;
  active?: boolean;
  label?: {
    title: string;
    amount: string;
    currencyCode: string;
    position?: "bottom" | "center";
  };
} & React.ComponentProps<typeof Image>) {
  const originalSrc = typeof props.src === "string" ? props.src : "";
  const cachedUrl = useCachedImageUrl(originalSrc);
  const [fallbackSrc, setFallbackSrc] = useState<string | null>(null);

  const finalSrc = fallbackSrc || cachedUrl || props.src;

  return (
    <div
      className={clsx(
        "group flex h-full w-full items-center justify-center overflow-hidden rounded-lg border bg-white hover:border-orange-600 dark:bg-black",
        {
          relative: label,
          "border-2 border-orange-600": active,
          "border-neutral-200 dark:border-neutral-800": !active,
        },
      )}
    >
      {props.src ? (
        <Image
          className={clsx("relative h-full w-full object-contain", {
            "transition duration-300 ease-in-out group-hover:scale-105":
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
      ) : null}
      {label ? (
        <Label
          title={label.title}
          amount={label.amount}
          currencyCode={label.currencyCode}
          position={label.position}
        />
      ) : null}
    </div>
  );
}
