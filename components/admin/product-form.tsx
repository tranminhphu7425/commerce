"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product, ProductVariant } from "lib/local/types";
import { createProductAction, updateProductAction } from "app/admin/actions";

export function ProductForm({ initialData }: { initialData?: Product }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Basic info
  const [title, setTitle] = useState(initialData?.title || "");
  const [handle, setHandle] = useState(initialData?.handle || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [imageUrl, setImageUrl] = useState(initialData?.featuredImage?.url || "");
  
  // Price info
  const defaultPrice = initialData?.priceRange.minVariantPrice.amount || "";
  const [price, setPrice] = useState(defaultPrice);

  const defaultComparePrice = initialData?.variants[0]?.compareAtPrice?.amount || "";
  const [comparePrice, setComparePrice] = useState(defaultComparePrice);

  // Options info (Simplify to max 1 Option for this basic form, e.g. "Size")
  const defaultOption = initialData?.options[0] || { name: "", values: [] };
  const [optionName, setOptionName] = useState(defaultOption.name);
  const [optionValuesStr, setOptionValuesStr] = useState(defaultOption.values.join(", "));

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!initialData) {
      // Auto-generate handle
      const newHandle = newTitle
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove diacritics
        .replace(/[^a-z0-9]+/g, "-") // replace non-alphanumeric with dash
        .replace(/(^-|-$)/g, ""); // remove leading/trailing dashes
      setHandle(newHandle);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const optionValues = optionValuesStr.split(",").map(v => v.trim()).filter(v => v);
      
      const options = optionValues.length > 0 && optionName ? [
        {
          id: `opt-${Date.now()}`,
          name: optionName,
          values: optionValues,
        }
      ] : [
        {
          id: `opt-default`,
          name: "Title",
          values: ["Default Title"],
        }
      ];

      const priceMoney = { amount: price, currencyCode: "VND" };
      const comparePriceMoney = comparePrice ? { amount: comparePrice, currencyCode: "VND" } : undefined;

      const variants: ProductVariant[] = optionValues.length > 0 && optionName
        ? optionValues.map((val, idx) => ({
            id: `var-${Date.now()}-${idx}`,
            title: val,
            availableForSale: true,
            selectedOptions: [{ name: optionName, value: val }],
            price: priceMoney,
            compareAtPrice: comparePriceMoney,
          }))
        : [
            {
              id: `var-${Date.now()}`,
              title: "Default Title",
              availableForSale: true,
              selectedOptions: [{ name: "Title", value: "Default Title" }],
              price: priceMoney,
              compareAtPrice: comparePriceMoney,
            }
          ];

      const image = {
        url: imageUrl || "https://placehold.co/800x800.png",
        altText: title,
        width: 800,
        height: 800,
      };

      const productData: Product = {
        id: initialData?.id || `prod-${Date.now()}`,
        handle: handle,
        title: title,
        availableForSale: true,
        description: description,
        descriptionHtml: `<p>${description}</p>`,
        options: options,
        priceRange: {
          minVariantPrice: priceMoney,
          maxVariantPrice: priceMoney,
        },
        variants: variants,
        featuredImage: image,
        images: [image],
        seo: {
          title: title,
          description: description,
        },
        tags: initialData?.tags || [],
        updatedAt: new Date().toISOString(),
      };

      if (initialData) {
        // preserve complex variants if they were heavily customized, 
        // but for this simple form we will overwrite them to ensure consistency
        const res = await updateProductAction(initialData.handle, productData);
        if (res.success) {
          router.push("/admin");
        } else {
          alert(res.error);
        }
      } else {
        const res = await createProductAction(productData);
        if (res.success) {
          router.push("/admin");
        } else {
          alert(res.error);
        }
      }
    } catch (error) {
      console.error(error);
      alert("Đã xảy ra lỗi hệ thống");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-neutral-900 p-8 rounded-xl border border-neutral-200 dark:border-neutral-800">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold">Tên sản phẩm *</label>
          <input
            required
            type="text"
            className="w-full p-3 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
            value={title}
            onChange={handleTitleChange}
            placeholder="Ví dụ: Máy đứng Titan Special"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Đường dẫn (URL Handle) *</label>
          <input
            required
            type="text"
            className="w-full p-3 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="vi-du-may-dung"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Giá bán (VND) *</label>
          <input
            required
            type="number"
            className="w-full p-3 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="670000"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Giá gốc (Chưa giảm - Tùy chọn)</label>
          <input
            type="number"
            className="w-full p-3 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
            value={comparePrice}
            onChange={(e) => setComparePrice(e.target.value)}
            placeholder="800000"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold">Hình ảnh chính (URL) *</label>
          <input
            required
            type="text"
            className="w-full p-3 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="/commerce/images/products/..."
          />
          {imageUrl && (
            <img src={imageUrl} alt="Preview" className="mt-2 h-32 w-32 object-cover rounded-lg border border-neutral-200" />
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold">Mô tả sản phẩm</label>
          <textarea
            rows={4}
            className="w-full p-3 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả chi tiết về sản phẩm..."
          />
        </div>
      </div>

      <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
        <h3 className="text-lg font-bold mb-4">Phân loại sản phẩm (Tùy chọn)</h3>
        <p className="text-sm text-neutral-500 mb-4">Nếu sản phẩm có nhiều kích cỡ hoặc màu sắc, hãy điền vào đây. Hệ thống sẽ tự động tạo các biến thể (Variants).</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Tên phân loại (VD: Size, Màu sắc)</label>
            <input
              type="text"
              className="w-full p-3 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
              value={optionName}
              onChange={(e) => setOptionName(e.target.value)}
              placeholder="Size"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Các giá trị (Ngăn cách bởi dấu phẩy)</label>
            <input
              type="text"
              className="w-full p-3 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
              value={optionValuesStr}
              onChange={(e) => setOptionValuesStr(e.target.value)}
              placeholder="1000, 2000, 3000"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 border-t border-neutral-200 dark:border-neutral-800 pt-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
        >
          Hủy bỏ
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-orange-600 text-white px-8 py-3 rounded-full font-bold hover:bg-orange-700 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting ? (
             <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : null}
          {initialData ? "Lưu thay đổi" : "Tạo sản phẩm mới"}
        </button>
      </div>

    </form>
  );
}
