import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import { defaultSort } from "lib/constants";
import { getProducts } from "lib/local";

export const metadata = {
  title: "Tìm kiếm",
  description: "Tìm kiếm sản phẩm trong cửa hàng.",
};

export const dynamic = "force-static";

export default async function SearchPage() {
  const { sortKey, reverse } = defaultSort;

  const products = await getProducts({ sortKey, reverse });

  return (
    <>
      {products.length > 0 ? (
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ProductGridItems products={products} />
        </Grid>
      ) : (
        <p className="py-3 text-lg">Không tìm thấy sản phẩm nào.</p>
      )}
    </>
  );
}
