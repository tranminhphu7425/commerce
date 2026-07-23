import { AddToCart } from "components/cart/add-to-cart";
import Prose from "components/prose";
import { Product } from "lib/local/types";
import { ProductPrice } from "./product-price";
import { VariantSelector } from "./variant-selector";

export function ProductDescription({
  product,
  selectedOptions,
  onOptionChange,
}: {
  product: Product;
  selectedOptions: Record<string, string>;
  onOptionChange: (name: string, value: string) => void;
}) {
  return (
    <>
      <div className="mb-6 flex flex-col border-b pb-6 dark:border-neutral-700">
        <h1 className="mb-2 text-5xl font-medium">{product.title}</h1>
        <ProductPrice product={product} selectedOptions={selectedOptions} />
      </div>
      <VariantSelector
        options={product.options}
        variants={product.variants}
        selectedOptions={selectedOptions}
        onOptionChange={onOptionChange}
      />
      {product.descriptionHtml ? (
        <Prose
          className="mb-6 text-sm leading-tight dark:text-white/[60%]"
          html={product.descriptionHtml}
        />
      ) : null}
      <AddToCart product={product} selectedOptions={selectedOptions} />
    </>
  );
}
