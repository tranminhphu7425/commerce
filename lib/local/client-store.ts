"use client";

import { useState, useEffect } from "react";
import type { Product } from "./types";
import { getGitHubConfig, commitMultipleFilesToGitHub, FileToCommit } from "lib/github";
import { saveImageCache, getImageCache, extractFilename } from "./image-cache";
import type { GitHubConfig } from "lib/github";

/**
 * Extract set of active image filenames referenced across all products
 */
function extractActiveImageFilenames(products: any[]): Set<string> {
  const set = new Set<string>();
  products.forEach((p: any) => {
    if (p.featuredImage?.url) {
      const fn = extractFilename(p.featuredImage.url);
      if (fn) set.add(fn);
    }
    if (Array.isArray(p.images)) {
      p.images.forEach((img: any) => {
        if (img?.url) {
          const fn = extractFilename(img.url);
          if (fn) set.add(fn);
        }
      });
    }
    if (Array.isArray(p.variants)) {
      p.variants.forEach((v: any) => {
        if (v.image?.url) {
          const fn = extractFilename(v.image.url);
          if (fn) set.add(fn);
        }
        if (Array.isArray(v.images)) {
          v.images.forEach((img: any) => {
            if (img?.url) {
              const fn = extractFilename(img.url);
              if (fn) set.add(fn);
            }
          });
        }
      });
    }
  });
  return set;
}

/**
 * Fetch list of physical image filenames currently on GitHub in public/images/products
 */
async function getRemoteImageFilenamesOnGitHub(config: GitHubConfig): Promise<string[]> {
  const { owner, repo, token, branch = "main" } = config;
  try {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/public/images/products?ref=${branch}`;
    const res = await fetch(apiUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data
          .filter((item: any) => item.type === "file")
          .map((item: any) => item.name);
      }
    }
  } catch {
    // ignore fetch errors
  }
  return [];
}

const OVERRIDE_KEY = "commerce_products_override";
const PENDING_IMAGES_KEY = "commerce_pending_images";
const DELETED_HANDLES_KEY = "commerce_deleted_handles";

export interface PendingImage {
  path: string;
  content: string; // Base64 content
  isBase64?: boolean;
}

// UTF-8 to Base64 helper
function utf8ToBase64(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

function base64ToUtf8(str: string): string {
  return decodeURIComponent(
    Array.prototype.map
      .call(atob(str.replace(/\n/g, "")), (c: string) =>
        "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
      )
      .join("")
  );
}

// --- Product Overrides ---

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

  // Remove from deleted list if re-saved
  const deleted = getDeletedHandles().filter((h) => h !== targetHandle && h !== product.handle);
  localStorage.setItem(DELETED_HANDLES_KEY, JSON.stringify(deleted));

  localStorage.setItem(OVERRIDE_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("commerce-store-updated"));
}

export function deleteLocalProductOverride(handle: string): void {
  if (typeof window === "undefined") return;
  const list = getLocalProductsOverride().filter((p) => p.handle !== handle);
  localStorage.setItem(OVERRIDE_KEY, JSON.stringify(list));

  const deleted = getDeletedHandles();
  if (!deleted.includes(handle)) {
    deleted.push(handle);
    localStorage.setItem(DELETED_HANDLES_KEY, JSON.stringify(deleted));
  }

  window.dispatchEvent(new CustomEvent("commerce-store-updated"));
}

export function getDeletedHandles(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(DELETED_HANDLES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function mergeProductsWithLocalOverride(
  baseProducts: (Product & { collections?: string[] })[]
): (Product & { collections?: string[] })[] {
  if (typeof window === "undefined") return baseProducts;
  const overrides = getLocalProductsOverride();
  const deletedHandles = getDeletedHandles();

  let result = baseProducts.filter((p) => !deletedHandles.includes(p.handle));

  overrides.forEach((override) => {
    if (deletedHandles.includes(override.handle)) return;
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

// --- Pending Images Staging ---

export function getPendingImagesMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PENDING_IMAGES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function savePendingImage(filenameOrPath: string, base64Content: string): void {
  if (typeof window === "undefined" || !filenameOrPath || !base64Content) return;
  try {
    // Extract clean filename (e.g. 17845-image.jpg)
    const cleanFilename = filenameOrPath
      .replace(/^(public|docs)\/images\/products\//, "")
      .replace(/^\/commerce\/images\/products\//, "");

    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/commerce";
    const relativeUrl = `${basePath}/images/products/${cleanFilename}`;
    saveImageCache(relativeUrl, base64Content);

    const map = getPendingImagesMap();
    const cleanBase64 = base64Content.includes(",")
      ? base64Content.split(",")[1]!
      : base64Content;

    map[cleanFilename] = cleanBase64;
    try {
      localStorage.setItem(PENDING_IMAGES_KEY, JSON.stringify(map));
    } catch (quotaErr) {
      console.warn("Could not save pending image to localStorage (quota reached), RAM cache will serve image preview:", quotaErr);
    }
    window.dispatchEvent(new CustomEvent("commerce-store-updated"));
  } catch (err) {
    console.warn("Could not save pending image to localStorage:", err);
  }
}

export function getPendingImages(): PendingImage[] {
  const map = getPendingImagesMap();
  const result: PendingImage[] = [];

  Object.entries(map).forEach(([filename, base64]) => {
    result.push({
      path: `public/images/products/${filename}`,
      content: base64,
      isBase64: true,
    });
    result.push({
      path: `docs/images/products/${filename}`,
      content: base64,
      isBase64: true,
    });
  });

  return result;
}

export function clearAllLocalOverridesAndPending(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(OVERRIDE_KEY);
  localStorage.removeItem(PENDING_IMAGES_KEY);
  localStorage.removeItem(DELETED_HANDLES_KEY);
  window.dispatchEvent(new CustomEvent("commerce-store-updated"));
}

export function getPendingChangesCount(): {
  products: number;
  deleted: number;
  images: number;
  total: number;
} {
  const overrides = getLocalProductsOverride();
  const deleted = getDeletedHandles();
  const imagesMap = getPendingImagesMap();
  const uniqueImagesCount = Object.keys(imagesMap).length;

  return {
    products: overrides.length,
    deleted: deleted.length,
    images: uniqueImagesCount,
    total: overrides.length + deleted.length + uniqueImagesCount,
  };
}

function cleanProductImageUrls(products: any[], basePath: string): any[] {
  if (basePath === "") {
    products.forEach((p: any) => {
      if (p.featuredImage?.url?.startsWith("/commerce/")) {
        p.featuredImage.url = p.featuredImage.url.replace(/^\/commerce/, "");
      }
      if (Array.isArray(p.images)) {
        p.images.forEach((img: any) => {
          if (img?.url?.startsWith("/commerce/")) {
            img.url = img.url.replace(/^\/commerce/, "");
          }
        });
      }
      if (Array.isArray(p.variants)) {
        p.variants.forEach((v: any) => {
          if (v.image?.url?.startsWith("/commerce/")) {
            v.image.url = v.image.url.replace(/^\/commerce/, "");
          }
          if (Array.isArray(v.images)) {
            v.images.forEach((img: any) => {
              if (img?.url?.startsWith("/commerce/")) {
                img.url = img.url.replace(/^\/commerce/, "");
              }
            });
          }
        });
      }
    });
  }
  return products;
}

/**
 * Fetch latest store.json dynamically from public/data/store.json over HTTP
 */
export async function fetchRemoteStoreData(): Promise<(Product & { collections?: string[] })[] | null> {
  if (typeof window === "undefined") return null;
  try {
    const timestamp = Date.now();
    const paths = [
      `/commerce/data/store.json?t=${timestamp}`,
      `/data/store.json?t=${timestamp}`,
      `./data/store.json?t=${timestamp}`,
    ];

    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/commerce";

    for (const p of paths) {
      try {
        const res = await fetch(p, { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json && Array.isArray(json.products)) {
            return cleanProductImageUrls(json.products, basePath);
          }
        }
      } catch {
        // continue
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

  const initialProductIds = initialProducts.map((p) => p.id).join(",");

  useEffect(() => {
    let isMounted = true;

    const refreshData = async () => {
      const localMerged = mergeProductsWithLocalOverride(initialProducts);
      if (isMounted) {
        setProducts(localMerged);
      }

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
  }, [initialProductIds]);

  return products;
}

/**
 * Commit all local pending changes (Modified JSON + Pending Images) to GitHub in 1 SINGLE COMMIT
 */
export async function commitPendingChangesToGitHub(): Promise<{
  success: boolean;
  error?: string;
}> {
  const config = getGitHubConfig();
  if (!config || !config.token) {
    return { success: false, error: "Chưa cấu hình Mã liên kết" };
  }

  const { owner, repo, token, branch = "main" } = config;
  const counts = getPendingChangesCount();
  if (counts.total === 0) {
    return { success: false, error: "Không có thay đổi nào đang lưu tạm." };
  }

  try {
    // 1. Fetch current data/store.json from GitHub
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/data/store.json?ref=${branch}`;
    const getRes = await fetch(apiUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!getRes.ok) {
      const err = await getRes.json().catch(() => ({}));
      return {
        success: false,
        error: `Không thể tải dữ liệu sản phẩm từ máy chủ: ${err.message || getRes.statusText}`,
      };
    }

    const fileData = await getRes.json();
    const currentJsonString = base64ToUtf8(fileData.content);
    const storeJson = JSON.parse(currentJsonString);

    if (!Array.isArray(storeJson.products)) {
      storeJson.products = [];
    }

    // 2. Apply deleted handles
    const deleted = getDeletedHandles();
    if (deleted.length > 0) {
      storeJson.products = storeJson.products.filter(
        (p: any) => !deleted.includes(p.handle)
      );
    }

    // 3. Apply product overrides
    const overrides = getLocalProductsOverride();
    overrides.forEach((override) => {
      const idx = storeJson.products.findIndex(
        (p: any) => p.handle === override.handle || p.id === override.id
      );
      if (idx !== -1) {
        storeJson.products[idx] = { ...storeJson.products[idx], ...override };
      } else {
        storeJson.products.unshift(override);
      }
    });

    // 4. Encode updated store.json to base64
    const updatedStoreStr = JSON.stringify(storeJson, null, 2);
    const updatedStoreBase64 = utf8ToBase64(updatedStoreStr);

    // 5. Build files list for commitMultipleFilesToGitHub
    const filesToCommit: FileToCommit[] = [
      {
        path: "data/store.json",
        content: updatedStoreBase64,
        isBase64: true,
      },
      {
        path: "public/data/store.json",
        content: updatedStoreBase64,
        isBase64: true,
      },
      {
        path: "docs/data/store.json",
        content: updatedStoreBase64,
        isBase64: true,
      },
    ];

    // 5. Add all pending images
    const pendingImages = getPendingImages();
    pendingImages.forEach((img) => {
      filesToCommit.push({
        path: img.path,
        content: img.content,
        isBase64: true,
      });
    });

    // 6. Detect orphaned/unused physical image files on GitHub Repo
    const activeFilenames = extractActiveImageFilenames(storeJson.products);
    const remoteFilenames = await getRemoteImageFilenamesOnGitHub(config);
    const orphanFilenames = remoteFilenames.filter((fn) => !activeFilenames.has(fn));

    let deletedOrphanCount = 0;
    orphanFilenames.forEach((fn) => {
      filesToCommit.push({
        path: `public/images/products/${fn}`,
        isDelete: true,
      });
      filesToCommit.push({
        path: `docs/images/products/${fn}`,
        isDelete: true,
      });
      deletedOrphanCount++;
    });

    // 7. Generate descriptive commit message
    const commitMsg = `feat(admin): batch commit ${counts.products} sp đã sửa, ${counts.deleted} sp đã xóa, ${counts.images} ảnh mới${
      deletedOrphanCount > 0 ? `, ${deletedOrphanCount} ảnh thừa đã xóa` : ""
    }`;

    // 8. Perform single commit to GitHub
    const res = await commitMultipleFilesToGitHub(filesToCommit, commitMsg);
    if (!res.success) {
      return res;
    }

    // 9. Clear local staging draft upon successful commit
    clearAllLocalOverridesAndPending();

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Lỗi xảy ra trong quá trình đồng bộ dữ liệu lên máy chủ",
    };
  }
}
