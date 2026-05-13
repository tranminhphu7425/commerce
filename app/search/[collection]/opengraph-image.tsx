import OpengraphImage from "components/opengraph-image";
import { getCollection, getCollections } from "lib/local";

export const dynamic = "force-static";

export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.map((collection) => ({
    collection: collection.handle,
  }));
}

export default async function Image({
  params,
}: {
  params: { collection: string };
}) {
  const collection = await getCollection(params.collection);
  const title = collection?.seo?.title || collection?.title;

  return await OpengraphImage({ title });
}
