"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product, ProductVariant } from "lib/local/types";
import { createProductAction, updateProductAction } from "app/admin/actions";
import { getGitHubConfig, uploadImageToGitHub, syncStoreToGitHub } from "lib/github";
import { toast } from "sonner";

export function ProductForm({ initialData }: { initialData?: Product }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ghConfig = getGitHubConfig();
    if (!ghConfig || !ghConfig.token) {
      toast.warning("Chưa cấu hình GitHub Token! Ảnh sẽ dùng xem trước. Hãy cấu hình Token ở đầu trang Admin để tải ảnh trực tiếp lên GitHub.");
      // Create local preview blob URL
      const objectUrl = URL.createObjectURL(file);
      setImageUrl(objectUrl);
      return;
    }

    setIsUploadingImage(true);
    setUploadStatus("Đang tải ảnh lên GitHub...");
    try {
      const res = await uploadImageToGitHub(file);
      if (res.success && res.url) {
        setImageUrl(res.url);
        setUploadStatus("✅ Đã tải ảnh lên GitHub thành công!");
        toast.success("Tải ảnh lên GitHub thành công!");
      } else {
        toast.error(`Lỗi upload ảnh lên GitHub: ${res.error}`);
        setUploadStatus(null);
      }
    } catch (err: any) {
      toast.error("Lỗi upload ảnh lên GitHub");
      setUploadStatus(null);
    } finally {
      setIsUploadingImage(false);
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

      // 1. Save locally (for dev server mode)
      if (initialData) {
        await updateProductAction(initialData.handle, productData);
      } else {
        await createProductAction(productData);
      }

      // 2. Sync directly to GitHub Repo if token is configured
      const ghConfig = getGitHubConfig();
      if (ghConfig && ghConfig.token) {
        const actionText = initialData ? "update" : "create";
        const syncRes = await syncStoreToGitHub((store) => {
          if (!store.products) store.products = [];
          if (initialData) {
            const idx = store.products.findIndex((p: any) => p.handle === initialData.handle);
            if (idx !== -1) {
              store.products[idx] = { ...store.products[idx], ...productData };
            } else {
              store.products.push(productData);
            }
          } else {
            store.products.push(productData);
          }
          return store;
        }, `feat(product): ${actionText} product "${title}"`);

        if (!syncRes.success) {
          toast.error(`Lưu cục bộ thành công nhưng lỗi khi push lên GitHub: ${syncRes.error}`);
        } else {
          toast.success(`🎉 Đã lưu sản phẩm "${title}" và push commit trực tiếp lên GitHub thành công!`);
        }
      } else {
        toast.info(`Đã lưu sản phẩm "${title}" cục bộ. (Chưa kết nối GitHub Token)`);
      }

      router.push("/admin");
    } catch (error) {
      console.error(error);
      toast.error("Đã xảy ra lỗi hệ thống khi lưu sản phẩm");
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

        <div className="space-y-3 md:col-span-2">
          <label className="text-sm font-semibold block">Hình ảnh sản phẩm *</label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">▶️ Cách 1: Tải ảnh từ máy tính (Tự động đẩy lên GitHub)</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploadingImage}
                className="w-full text-xs text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 dark:file:bg-orange-950 dark:file:text-orange-300"
              />
              {uploadStatus && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 font-medium">{uploadStatus}</p>
              )}
            </div>

            <div>
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">▶️ Cách 2: Hoặc Dán URL đường dẫn ảnh</span>
              <input
                required
                type="text"
                className="w-full p-2.5 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="/commerce/images/products/... hoặc https://..."
              />
            </div>
          </div>

          {imageUrl && (
            <div className="flex items-center gap-4 mt-2">
              <img src={imageUrl} alt="Preview" className="h-28 w-28 object-cover rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm" />
              <div className="text-xs text-neutral-500 font-mono break-all max-w-md">
                <strong>URL:</strong> {imageUrl}
              </div>
            </div>
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
        <p className="text-sm text-neutral-700 mb-4">Nếu sản phẩm có nhiều kích cỡ hoặc màu sắc, hãy điền vào đây. Hệ thống sẽ tự động tạo các biến thể (Variants).</p>
        
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
