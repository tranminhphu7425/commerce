import { getCollection, getCollectionProducts, getCollections } from "lib/local";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-static";

export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.map((collection) => ({
    collection: collection.handle,
  }));
}

import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import { defaultSort } from "lib/constants";

export async function generateMetadata(props: {
  params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const collection = await getCollection(params.collection);

  if (!collection) return notFound();

  return {
    title: collection.seo?.title || collection.title,
    description:
      collection.seo?.description ||
      collection.description ||
      `${collection.title} products`,
  };
}

export default async function CategoryPage(props: {
  params: Promise<{ collection: string }>;
}) {
  const params = await props.params;
  const { sortKey, reverse } = defaultSort;
  const products = await getCollectionProducts({
    collection: params.collection,
    sortKey,
    reverse,
  });

  return (
    <section>
      {products.length === 0 ? (
        <p className="py-3 text-lg">{`No products found in this collection`}</p>
      ) : (
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ProductGridItems products={products} />
        </Grid>
      )}
    </section>
  );
}
