"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import type { ListItem } from ".";
import clsx from "clsx";
import { FilterItem } from "./item";

export default function FilterItemDropdown({ list, title }: { list: ListItem[]; title?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState("");
  const [openSelect, setOpenSelect] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpenSelect(false);
      }
    };

    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    list.forEach((listItem: ListItem) => {
      if (
        ("path" in listItem && pathname === listItem.path) ||
        ("slug" in listItem && searchParams.get("sort") === listItem.slug)
      ) {
        setActive(listItem.title);
      }
    });
  }, [pathname, list, searchParams]);

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => {
          setOpenSelect(!openSelect);
        }}
        className="flex w-full items-center justify-between rounded-full border border-neutral-200 bg-neutral-50/50 px-4 py-2.5 text-xs font-medium transition-all hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800/50 dark:hover:bg-neutral-800"
      >
        <div className="truncate pr-2">
          <span className="text-neutral-400 mr-1 font-normal">{title}:</span> {active || "Tất cả"}
        </div>
        <ChevronDownIcon className={clsx("h-4 w-4 transition-transform duration-200", { "rotate-180": openSelect })} />
      </div>
      {openSelect && (
        <div
          onClick={() => {
            setOpenSelect(false);
          }}
          className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="flex flex-col p-1">
            {list.map((item: ListItem, i) => (
              <FilterItem key={i} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
