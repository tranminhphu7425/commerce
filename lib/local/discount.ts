import { Product } from "./types";

export function getCheapestVariantDiscount(product: Product): {
  discountPercent: number;
  minPrice: string;
  compareAtAmount?: string;
} {
  const minPrice = product.priceRange.minVariantPrice.amount;
  
  // Tìm variant có giá rẻ nhất khớp với minVariantPrice
  let cheapestVariant = product.variants.find(
    v => parseFloat(v.price.amount) === parseFloat(minPrice)
  );

  // Nếu không tìm thấy, lấy variant đầu tiên làm mặc định
  if (!cheapestVariant && product.variants.length > 0) {
    cheapestVariant = product.variants[0];
  }
  
  if (
    cheapestVariant &&
    cheapestVariant.compareAtPrice &&
    parseFloat(cheapestVariant.compareAtPrice.amount) > parseFloat(cheapestVariant.price.amount)
  ) {
    const price = parseFloat(cheapestVariant.price.amount);
    const compareAt = parseFloat(cheapestVariant.compareAtPrice.amount);
    const discountPercent = Math.round(((compareAt - price) / compareAt) * 100);
    return { 
      discountPercent, 
      minPrice: cheapestVariant.price.amount,
      compareAtAmount: cheapestVariant.compareAtPrice.amount 
    };
  }
  
  return { 
    discountPercent: 0, 
    minPrice: cheapestVariant ? cheapestVariant.price.amount : minPrice,
    compareAtAmount: cheapestVariant?.compareAtPrice?.amount
  };
}
