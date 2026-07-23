import { getCollection, getCollectionProducts, getCollections } from "lib/local";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import SortableProductList from "components/layout/sortable-product-list";

export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.map((collection) => ({
    collection: collection.handle,
  }));
}

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

export const dynamic = "force-static";

export default async function CategoryPage(props: {
  params: Promise<{ collection: string }>;
}) {
  const params = await props.params;

  const products = await getCollectionProducts({
    collection: params.collection,
  });

  return (
    <section>
      <SortableProductList products={products} />
    </section>
  );
}
