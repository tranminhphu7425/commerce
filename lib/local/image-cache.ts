"use client";

import { useState, useEffect } from "react";

const IMAGE_CACHE_KEY = "commerce_image_cache";
const MAX_CACHE_ENTRIES = 30;

type CacheMap = Record<string, string>;

function getCacheMap(): CacheMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(IMAGE_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Save a dataUrl (Base64) or Blob URL mapping for a target image URL path
 */
export function saveImageCache(urlPath: string, dataUrl: string): void {
  if (typeof window === "undefined" || !urlPath || !dataUrl) return;
  try {
    const cache = getCacheMap();
    // Normalize path by stripping query params
    const cleanPath = urlPath.split("?")[0]!;

    cache[cleanPath] = dataUrl;

    // Prune if cache grows too large to prevent localStorage quota error
    const keys = Object.keys(cache);
    if (keys.length > MAX_CACHE_ENTRIES) {
      const keysToRemove = keys.slice(0, keys.length - MAX_CACHE_ENTRIES);
      keysToRemove.forEach((k) => delete cache[k]);
    }

    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
    window.dispatchEvent(
      new CustomEvent("commerce-image-cache-updated", {
        detail: { urlPath: cleanPath, dataUrl },
      })
    );
  } catch (err) {
    console.warn("Could not save image cache:", err);
  }
}

/**
 * Retrieve cached Base64 / Data URL for an image path if available
 */
export function getImageCache(urlPath?: string): string | null {
  if (typeof window === "undefined" || !urlPath) return null;
  // If urlPath is already a blob URL or base64 Data URL, return as is
  if (urlPath.startsWith("blob:") || urlPath.startsWith("data:")) return urlPath;

  const cleanPath = urlPath.split("?")[0]!;
  const cache = getCacheMap();
  return cache[cleanPath] || null;
}

/**
 * Synchronously get the effective image URL (cached Data URL if available, otherwise original path)
 */
export function getEffectiveImageUrl(urlPath?: string): string {
  if (!urlPath) return "";
  const cached = getImageCache(urlPath);
  return cached || urlPath;
}

/**
 * React hook to get and reactively update cached image URL in components
 */
export function useCachedImageUrl(urlPath?: string): string {
  const [effectiveUrl, setEffectiveUrl] = useState(() => getEffectiveImageUrl(urlPath));

  useEffect(() => {
    setEffectiveUrl(getEffectiveImageUrl(urlPath));

    if (typeof window === "undefined" || !urlPath) return;

    const cleanPath = urlPath.split("?")[0]!;

    const handleCacheUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<{ urlPath: string; dataUrl: string }>;
      if (customEvt.detail && customEvt.detail.urlPath === cleanPath) {
        setEffectiveUrl(customEvt.detail.dataUrl);
      }
    };

    window.addEventListener("commerce-image-cache-updated", handleCacheUpdate);
    return () => {
      window.removeEventListener("commerce-image-cache-updated", handleCacheUpdate);
    };
  }, [urlPath]);

  return effectiveUrl;
}
