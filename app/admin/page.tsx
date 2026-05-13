import { getAllProductsSync } from "lib/local";
import Link from "next/link";
import { ProductTable } from "components/admin/product-table";

export default function AdminPage() {
  const products = getAllProductsSync();

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Quản lý sản phẩm</h1>
        <Link
          href="/admin/products/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          + Thêm sản phẩm mới
        </Link>
      </div>

      <ProductTable products={products} />
    </div>
  );
}
