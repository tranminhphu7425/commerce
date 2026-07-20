"use client";

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
