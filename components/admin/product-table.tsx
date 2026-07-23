"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Product } from "lib/local";
import { getGitHubConfig } from "lib/github";
import { toast } from "sonner";
import { deleteLocalProductOverride, mergeProductsWithLocalOverride } from "lib/local/client-store";
import { useCachedImageUrl, getImageCache } from "lib/local/image-cache";

function TableProductImage({ src, alt }: { src: string; alt: string }) {
  const cachedSrc = useCachedImageUrl(src);
  const effectiveSrc = cachedSrc || getImageCache(src) || src;
  return (
    <img
      src={effectiveSrc}
      alt={alt}
      className="w-12 h-12 object-cover rounded"
      onError={(e) => {
        const cached = getImageCache(src);
        if (cached && e.currentTarget.src !== cached) {
          e.currentTarget.src = cached;
        }
      }}
    />
  );
}

export function ProductTable({ products: initialProducts }: { products: (Product & { collections?: string[] })[] }) {
  const [productList, setProductList] = useState(() => mergeProductsWithLocalOverride(initialProducts));

  useEffect(() => {
    const sync = () => {
      setProductList(mergeProductsWithLocalOverride(initialProducts));
    };
    sync();
    window.addEventListener("commerce-store-updated", sync);
    return () => window.removeEventListener("commerce-store-updated", sync);
  }, [initialProducts]);

  const handleDelete = async (handle: string, title: string) => {
    if (confirm(`Bạn có chắc muốn xóa sản phẩm "${title}"?`)) {
      // 1. Delete locally & update state immediately (Staged in localStorage)
      deleteLocalProductOverride(handle);
      setProductList((prev) => prev.filter((p) => p.handle !== handle));
      toast.success(
        `🎉 Đã xóa tạm thời sản phẩm "${title}"! Hãy bấm "Lưu thay đổi" để cập nhật lên Server.`
      );

      const { deleteProductAction } = await import("app/admin/actions");
      await deleteProductAction(handle);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-800">
            <th className="p-4 font-semibold">Ảnh</th>
            <th className="p-4 font-semibold">Tên sản phẩm</th>
            <th className="p-4 font-semibold">Giá</th>
            <th className="p-4 font-semibold">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {productList.map((product) => (
            <tr
              key={product.id}
              className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <td className="p-4">
                <TableProductImage
                  src={product.featuredImage?.url || ""}
                  alt={product.title}
                />
              </td>
              <td className="p-4 font-medium">{product.title}</td>
              <td className="p-4">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(Number(product.priceRange.minVariantPrice.amount))}
              </td>
              <td className="p-4">
                <div className="flex gap-3">
                  <Link
                    href={`/admin/products/${product.handle}/edit`}
                    className="text-orange-600 hover:underline"
                  >
                    Sửa
                  </Link>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => handleDelete(product.handle, product.title)}
                  >
                    Xóa
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
