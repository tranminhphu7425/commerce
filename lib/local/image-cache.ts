"use client";

import { useState, useEffect } from "react";

const IMAGE_CACHE_KEY = "commerce_image_cache";
const PENDING_IMAGES_KEY = "commerce_pending_images";
const MAX_CACHE_ENTRIES = 50;

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
  try {
    const cache = getCacheMap();
    const cleanPath = urlPath.split("?")[0]!;
    const filename = extractFilename(cleanPath);

    cache[cleanPath] = dataUrl;
    if (filename) {
      cache[filename] = dataUrl;
      cache[`/commerce/images/products/${filename}`] = dataUrl;
      cache[`/images/products/${filename}`] = dataUrl;
    }

    // Prune if cache grows too large to prevent localStorage quota error
    const keys = Object.keys(cache);
    if (keys.length > MAX_CACHE_ENTRIES) {
      const keysToRemove = keys.slice(0, keys.length - MAX_CACHE_ENTRIES);
      keysToRemove.forEach((k) => delete cache[k]);
    }

    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
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
 * Guaranteed fallback to pending images in localStorage before commit
 */
export function getImageCache(urlPath?: string): string | null {
  if (typeof window === "undefined" || !urlPath) return null;
  // If urlPath is already a blob URL or base64 Data URL, return as is
  if (urlPath.startsWith("blob:") || urlPath.startsWith("data:")) return urlPath;

  const cleanPath = urlPath.split("?")[0]!;
  const filename = extractFilename(cleanPath);
  const cache = getCacheMap();

  // 1. Check direct path match in image cache
  if (cache[cleanPath]) return cache[cleanPath]!;

  // 2. Check filename variations in image cache
  if (filename) {
    if (cache[filename]) return cache[filename]!;
    if (cache[`/commerce/images/products/${filename}`]) return cache[`/commerce/images/products/${filename}`]!;
    if (cache[`/images/products/${filename}`]) return cache[`/images/products/${filename}`]!;
    if (cache[`public/images/products/${filename}`]) return cache[`public/images/products/${filename}`]!;
    if (cache[`docs/images/products/${filename}`]) return cache[`docs/images/products/${filename}`]!;
  }

  // 3. Fallback: check pending images in localStorage
  try {
    const rawPending = localStorage.getItem(PENDING_IMAGES_KEY);
    if (rawPending) {
      const pendingMap: Record<string, string> = JSON.parse(rawPending);
      if (filename && pendingMap[filename]) {
        const rawBase64 = pendingMap[filename]!;
        return rawBase64.startsWith("data:")
          ? rawBase64
          : `data:image/jpeg;base64,${rawBase64}`;
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

    window.addEventListener("commerce-image-cache-updated", handleCacheUpdate);
    window.addEventListener("commerce-store-updated", () => {
      setEffectiveUrl(getEffectiveImageUrl(urlPath));
    });

    return () => {
      window.removeEventListener("commerce-image-cache-updated", handleCacheUpdate);
      window.removeEventListener("commerce-store-updated", () => {});
    };
  }, [urlPath]);

  return effectiveUrl;
}
