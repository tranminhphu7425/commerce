import { getAllProductsSync } from "lib/local";
import Link from "next/link";
import { ProductTable } from "components/admin/product-table";
import { GitHubConfigModal } from "components/admin/github-config-modal";
import { BatchCommitBar } from "components/admin/batch-commit-bar";

export default function AdminPage() {
  const products = getAllProductsSync();

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Quản lý sản phẩm</h1>
        <Link
          href="/admin/products/new"
          className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors font-medium text-sm"
        >
          + Thêm sản phẩm mới
        </Link>
      </div>

      <BatchCommitBar />

      <GitHubConfigModal />

      <ProductTable products={products} />
    </div>
  );
}
