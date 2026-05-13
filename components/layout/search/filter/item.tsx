"use client";

import clsx from "clsx";
import type { SortFilterItem } from "lib/constants";
import { createUrl } from "lib/utils";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ListItem, PathFilterItem } from ".";

function PathFilterItem({ item }: { item: PathFilterItem }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = pathname === item.path;
  const newParams = new URLSearchParams(searchParams.toString());

  newParams.delete("q");

  return (
    <li className="flex text-black dark:text-white" key={item.title}>
      {active ? (
        <p className="w-full px-4 py-2 text-sm bg-neutral-100 font-bold dark:bg-neutral-800 rounded-lg">
          {item.title}
        </p>
      ) : (
        <Link
          href={createUrl(item.path, newParams)}
          className="w-full px-4 py-2 text-sm transition-colors rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
        >
          {item.title}
        </Link>
      )}
    </li>
  );
}

function SortFilterItem({ item }: { item: SortFilterItem }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("sort") === item.slug;
  const q = searchParams.get("q");
  const href = createUrl(
    pathname,
    new URLSearchParams({
      ...(q && { q }),
      ...(item.slug && item.slug.length && { sort: item.slug }),
    }),
  );

  return (
    <li
      className="flex text-sm text-black dark:text-white"
      key={item.title}
    >
      {active ? (
        <p className="w-full px-4 py-2 text-sm bg-neutral-100 font-bold dark:bg-neutral-800 rounded-lg">
          {item.title}
        </p>
      ) : (
        <Link
          prefetch={false}
          href={href}
          className="w-full px-4 py-2 transition-colors rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
        >
          {item.title}
        </Link>
      )}
    </li>
  );
}

export function FilterItem({ item }: { item: ListItem }) {
  return "path" in item ? (
    <PathFilterItem item={item} />
  ) : (
    <SortFilterItem item={item} />
  );
}
