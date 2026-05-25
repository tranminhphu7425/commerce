"use client";

import Link from "next/link";
import { Product } from "lib/local";

export function ProductTable({ products }: { products: (Product & { collections?: string[] })[] }) {
  const handleDelete = async (handle: string) => {
    if (confirm("Bạn có chắc muốn xóa?")) {
      const { deleteProductAction } = await import("app/admin/actions");
      const res = await deleteProductAction(handle);
      if (res.success) {
        window.location.reload();
      } else {
        alert(res.error || "Lỗi khi xóa sản phẩm");
      }
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
          {products.map((product) => (
            <tr
              key={product.id}
              className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <td className="p-4">
                <img
                  src={product.featuredImage.url}
                  alt={product.title}
                  className="w-12 h-12 object-cover rounded"
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
                    onClick={() => handleDelete(product.handle)}
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
