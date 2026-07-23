import SortableProductList from "components/layout/sortable-product-list";
import { getProducts } from "lib/local";

export const metadata = {
  title: "Tìm kiếm",
  description: "Tìm kiếm sản phẩm trong cửa hàng.",
};

export const dynamic = "force-static";

export default async function SearchPage() {
  const products = await getProducts({});

  return (
    <SortableProductList products={products} />
  );
}
