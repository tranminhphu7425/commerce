"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import type { CartItem } from "lib/local/types";

export function DeleteItemButton({
  item,
  optimisticUpdate,
}: {
  item: CartItem;
  optimisticUpdate: any;
}) {
  const merchandiseId = item.merchandise.id;

  return (
    <button
      onClick={() => optimisticUpdate(merchandiseId, "delete")}
      aria-label="Remove cart item"
      className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-neutral-500"
    >
      <XMarkIcon className="mx-[1px] h-4 w-4 text-white dark:text-black" />
    </button>
  );
}
