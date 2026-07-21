"use client";

import { useState, useEffect } from "react";

const IMAGE_CACHE_KEY = "commerce_image_cache";
const PENDING_IMAGES_KEY = "commerce_pending_images";
const MAX_CACHE_ENTRIES = 30;

type CacheMap = Record<string, string>;

// Module-level in-memory RAM cache (immunity against localStorage quota limits & instant preview)
const inMemoryCache = new Map<string, string>();

function getCacheMap(): CacheMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(IMAGE_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function extractFilename(pathStr?: string): string {
  if (!pathStr) return "";
  const clean = pathStr.split("?")[0]!;
  const parts = clean.split("/");
  return parts[parts.length - 1] || clean;
}

/**
 * Save a dataUrl (Base64) or Blob URL mapping for a target image URL path
 */
export function saveImageCache(urlPath: string, dataUrl: string): void {
  if (typeof window === "undefined" || !urlPath || !dataUrl) return;

  const cleanPath = urlPath.split("?")[0]!;
  const filename = extractFilename(cleanPath);

  // 1. Always populate in-memory RAM cache first
  inMemoryCache.set(cleanPath, dataUrl);
  if (filename) {
    inMemoryCache.set(filename, dataUrl);
    inMemoryCache.set(`/commerce/images/products/${filename}`, dataUrl);
    inMemoryCache.set(`/images/products/${filename}`, dataUrl);
    inMemoryCache.set(`public/images/products/${filename}`, dataUrl);
    inMemoryCache.set(`docs/images/products/${filename}`, dataUrl);
  }

  // 2. Persist to localStorage safely
  try {
    const cache = getCacheMap();
    cache[cleanPath] = dataUrl;
    if (filename) {
      cache[filename] = dataUrl;
    }

    // Prune if cache grows too large to prevent localStorage quota error
    const keys = Object.keys(cache);
    if (keys.length > MAX_CACHE_ENTRIES) {
      const keysToRemove = keys.slice(0, keys.length - MAX_CACHE_ENTRIES);
      keysToRemove.forEach((k) => delete cache[k]);
    }

    try {
      localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
    } catch (quotaErr) {
      // If QuotaExceededError occurs, trim half of oldest cache entries and retry
      const remainingKeys = Object.keys(cache);
      const toTrim = remainingKeys.slice(0, Math.max(1, Math.floor(remainingKeys.length / 2)));
      toTrim.forEach((k) => delete cache[k]);
      try {
        localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
      } catch {
        // Ignore: RAM cache guarantees preview will work
      }
    }

    window.dispatchEvent(
      new CustomEvent("commerce-image-cache-updated", {
        detail: { urlPath: cleanPath, filename, dataUrl },
      })
    );
  } catch (err) {
    console.warn("Could not save image cache:", err);
  }
}

/**
 * Retrieve cached Base64 / Data URL for an image path if available
 * Guaranteed fallback to pending images & in-memory RAM cache
 */
export function getImageCache(urlPath?: string): string | null {
  if (typeof window === "undefined" || !urlPath) return null;
  // If urlPath is already a blob URL or base64 Data URL, return as is
  if (urlPath.startsWith("blob:") || urlPath.startsWith("data:")) return urlPath;

  const cleanPath = urlPath.split("?")[0]!;
  const filename = extractFilename(cleanPath);

  // 1. Check in-memory RAM cache first
  if (inMemoryCache.has(cleanPath)) return inMemoryCache.get(cleanPath)!;
  if (filename) {
    if (inMemoryCache.has(filename)) return inMemoryCache.get(filename)!;
    if (inMemoryCache.has(`/commerce/images/products/${filename}`)) return inMemoryCache.get(`/commerce/images/products/${filename}`)!;
    if (inMemoryCache.has(`/images/products/${filename}`)) return inMemoryCache.get(`/images/products/${filename}`)!;
    if (inMemoryCache.has(`public/images/products/${filename}`)) return inMemoryCache.get(`public/images/products/${filename}`)!;
    if (inMemoryCache.has(`docs/images/products/${filename}`)) return inMemoryCache.get(`docs/images/products/${filename}`)!;
  }

  // 2. Check direct path match in localStorage image cache
  const cache = getCacheMap();
  if (cache[cleanPath]) {
    const val = cache[cleanPath]!;
    inMemoryCache.set(cleanPath, val);
    return val;
  }

  // 3. Check filename variations in localStorage image cache
  if (filename) {
    if (cache[filename]) {
      const val = cache[filename]!;
      inMemoryCache.set(filename, val);
      return val;
    }
    if (cache[`/commerce/images/products/${filename}`]) {
      const val = cache[`/commerce/images/products/${filename}`]!;
      inMemoryCache.set(cleanPath, val);
      return val;
    }
    if (cache[`/images/products/${filename}`]) {
      const val = cache[`/images/products/${filename}`]!;
      inMemoryCache.set(cleanPath, val);
      return val;
    }
  }

  // 4. Fallback: check pending images in localStorage
  try {
    const rawPending = localStorage.getItem(PENDING_IMAGES_KEY);
    if (rawPending) {
      const pendingMap: Record<string, string> = JSON.parse(rawPending);
      if (filename && pendingMap[filename]) {
        const rawBase64 = pendingMap[filename]!;
        const dataUrl = rawBase64.startsWith("data:")
          ? rawBase64
          : `data:image/jpeg;base64,${rawBase64}`;

        inMemoryCache.set(cleanPath, dataUrl);
        if (filename) inMemoryCache.set(filename, dataUrl);
        return dataUrl;
      }
    }
  } catch {
    // ignore json parse error
  }

  return null;
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
    const filename = extractFilename(cleanPath);

    const handleCacheUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<{ urlPath: string; filename?: string; dataUrl: string }>;
      if (customEvt.detail) {
        if (
          customEvt.detail.urlPath === cleanPath ||
          (filename && customEvt.detail.filename === filename)
        ) {
          setEffectiveUrl(customEvt.detail.dataUrl);
        }
      }
    };

    const handleStoreUpdate = () => {
      setEffectiveUrl(getEffectiveImageUrl(urlPath));
    };

    window.addEventListener("commerce-image-cache-updated", handleCacheUpdate);
    window.addEventListener("commerce-store-updated", handleStoreUpdate);

    return () => {
      window.removeEventListener("commerce-image-cache-updated", handleCacheUpdate);
      window.removeEventListener("commerce-store-updated", handleStoreUpdate);
    };
  }, [urlPath]);

  return effectiveUrl;
}

