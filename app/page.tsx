import { Carousel } from "components/carousel";
import Features from "components/features";
import { ThreeItemGrid } from "components/grid/three-items";
import Hero from "components/hero";
import Footer from "components/layout/footer";
import ShopInfo from "components/shop-info";
import { getProducts } from "lib/local";

export const metadata = {
  description:
    "Cửa hàng đồ câu cá chính hãng - Chí Toàn Fishing Shop. Chuyên cung cấp cần câu, máy câu, mồi lure và phụ kiện chất lượng cao.",
  openGraph: {
    type: "website",
  },
};

export default async function HomePage() {
  const products = await getProducts({});

  return (
    <>
      <Hero />
      <ShopInfo totalProducts={products.length} />
      <Features />
      <ThreeItemGrid initialProducts={products} />
      <Carousel initialProducts={products} />
      <Footer />
    </>
  );
}
