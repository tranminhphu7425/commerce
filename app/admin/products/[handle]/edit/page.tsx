import { ProductForm } from "components/admin/product-form";
import { getProduct, getAllProductsSync } from "lib/local";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const products = getAllProductsSync();
  return products.map((product) => ({
    handle: product.handle,
  }));
}

export default async function EditProductPage(props: {
  params: Promise<{ handle: string }>;
}) {
  const params = await props.params;
  const product = await getProduct(params.handle);

  if (!product) {
    return notFound();
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/admin" className="text-neutral-700 hover:text-orange-600 font-medium">
          ← Quay lại
        </Link>
        <h1 className="text-3xl font-bold">Chỉnh sửa sản phẩm</h1>
      </div>
      <ProductForm initialData={product} />
    </div>
  );
}
