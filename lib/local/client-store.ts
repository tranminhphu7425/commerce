"use client";

import { useState, useEffect } from "react";
import type { Product } from "./types";

const OVERRIDE_KEY = "commerce_products_override";

export function getLocalProductsOverride(): (Product & { collections?: string[] })[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(OVERRIDE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveLocalProductOverride(
  product: Product & { collections?: string[] },
  oldHandle?: string
): void {
  if (typeof window === "undefined") return;
  const list = getLocalProductsOverride();
  const targetHandle = oldHandle || product.handle;
  const index = list.findIndex(
    (p) => p.handle === targetHandle || p.id === product.id
  );

  if (index !== -1) {
    list[index] = { ...list[index], ...product };
  } else {
    list.unshift(product);
  }

  localStorage.setItem(OVERRIDE_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("commerce-store-updated"));
}

export function deleteLocalProductOverride(handle: string): void {
  if (typeof window === "undefined") return;
  const list = getLocalProductsOverride().filter((p) => p.handle !== handle);
  localStorage.setItem(OVERRIDE_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("commerce-store-updated"));
}

export function mergeProductsWithLocalOverride(
  baseProducts: (Product & { collections?: string[] })[]
): (Product & { collections?: string[] })[] {
  if (typeof window === "undefined") return baseProducts;
  const overrides = getLocalProductsOverride();
  if (overrides.length === 0) return baseProducts;

  const result = [...baseProducts];
  overrides.forEach((override) => {
    const idx = result.findIndex(
      (p) => p.handle === override.handle || p.id === override.id
    );
    if (idx !== -1) {
      result[idx] = { ...result[idx], ...override };
    } else {
      result.unshift(override);
    }
  });

  return result;
}

/**
 * Fetch latest store.json dynamically from public/data/store.json over HTTP
 */
export async function fetchRemoteStoreData(): Promise<(Product & { collections?: string[] })[] | null> {
  if (typeof window === "undefined") return null;
  try {
    const timestamp = Date.now();
    // Paths to attempt: relative to current base path or /data/store.json
    const paths = [
      `/commerce/data/store.json?t=${timestamp}`,
      `/data/store.json?t=${timestamp}`,
      `./data/store.json?t=${timestamp}`
    ];

    for (const p of paths) {
      try {
        const res = await fetch(p, { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json && Array.isArray(json.products)) {
            return json.products;
          }
        }
      } catch {
        // continue to next path
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * React hook to get dynamically updated products in Client Components
 */
export function useDynamicProducts(
  initialProducts: (Product & { collections?: string[] })[] = []
) {
  const [products, setProducts] = useState(() =>
    mergeProductsWithLocalOverride(initialProducts)
  );

  useEffect(() => {
    let isMounted = true;

    const refreshData = async () => {
      // 1. First merge with local overrides
      const localMerged = mergeProductsWithLocalOverride(initialProducts);
      if (isMounted) {
        setProducts(localMerged);
      }

      // 2. Fetch latest store.json from server/GitHub Pages
      const remoteProducts = await fetchRemoteStoreData();
      if (remoteProducts && isMounted) {
        const remoteMerged = mergeProductsWithLocalOverride(remoteProducts);
        setProducts(remoteMerged);
      }
    };

    refreshData();

    const handleUpdate = () => {
      refreshData();
    };

    window.addEventListener("commerce-store-updated", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("commerce-store-updated", handleUpdate);
    };
  }, [initialProducts]);

  return products;
}

