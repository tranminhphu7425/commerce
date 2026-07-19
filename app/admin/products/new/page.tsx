import { ProductForm } from "components/admin/product-form";
import Link from "next/link";

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/admin" className="text-neutral-700 hover:text-orange-600 font-medium">
          ← Quay lại
        </Link>
        <h1 className="text-3xl font-bold">Thêm sản phẩm mới</h1>
      </div>
      <ProductForm />
    </div>
  );
}
