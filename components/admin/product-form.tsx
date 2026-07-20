"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Product, ProductVariant, ProductOption } from "lib/local/types";
import { createProductAction, updateProductAction } from "app/admin/actions";
import { getGitHubConfig, uploadImageToGitHub, syncStoreToGitHub } from "lib/github";
import { toast } from "sonner";

// Helper to generate cartesian product of option values
const cartesian = (arrays: string[][]): string[][] => {
  if (arrays.length === 0) return [];
  return arrays.reduce((acc, curr) => {
    if (curr.length === 0) return acc;
    if (acc.length === 0) return curr.map(c => [c]);
    return acc.flatMap(a => curr.map(c => [...a, c]));
  }, [] as string[][]);
};

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
  const [availableForSale, setAvailableForSale] = useState(initialData?.availableForSale ?? true);
  
  // Options
  const [options, setOptions] = useState<{ id: string; name: string; valuesStr: string }[]>(
    initialData?.options && initialData.options.length > 0 && initialData.options[0]?.name !== "Title"
      ? initialData.options.map((o, i) => ({ id: o.id || `opt-${i}`, name: o.name, valuesStr: o.values.join(", ") })) 
      : []
  );

  // Variants
  const [variantsData, setVariantsData] = useState<Record<string, any>>(() => {
    const vData: Record<string, any> = {};
    if (initialData?.variants) {
      initialData.variants.forEach(v => {
        vData[v.title] = {
          price: v.price?.amount || "",
          compareAtPrice: v.compareAtPrice?.amount || "",
          importPrice: v.importPrice?.amount || "",
          images: v.images?.map(img => img.url) || (v.image ? [v.image.url] : [])
        };
      });
    }
    return vData;
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!initialData) {
      const newHandle = newTitle
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setHandle(newHandle);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, variantTitle?: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const ghConfig = getGitHubConfig();
    const uploadedUrls: string[] = [];

    setIsUploadingImage(true);
    setUploadStatus("Đang tải ảnh...");

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;

      if (!ghConfig || !ghConfig.token) {
        toast.warning("Chưa cấu hình GitHub Token! Ảnh sẽ dùng xem trước nội bộ.");
        uploadedUrls.push(URL.createObjectURL(file));
      } else {
        try {
          const res = await uploadImageToGitHub(file);
          if (res.success && res.url) {
            uploadedUrls.push(res.url);
          } else {
            toast.error(`Lỗi upload ảnh: ${res.error}`);
          }
        } catch (err: any) {
          toast.error("Lỗi hệ thống khi upload ảnh");
        }
      }
    }

    if (variantTitle) {
      setVariantsData(prev => {
         const current = prev[variantTitle] || {};
         return {
           ...prev,
           [variantTitle]: {
             ...current,
             images: [...(current.images || []), ...uploadedUrls]
           }
         };
      });
    } else {
      if (uploadedUrls.length > 0 && uploadedUrls[0]) {
        setImageUrl(uploadedUrls[0]);
      }
    }
    
    setUploadStatus(null);
    setIsUploadingImage(false);
  };

  const addOption = () => {
    setOptions([...options, { id: `opt-${Date.now()}`, name: "", valuesStr: "" }]);
  };

  const removeOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  const updateOption = (index: number, field: "name" | "valuesStr", value: string) => {
    const newOptions = [...options];
    if (newOptions[index]) {
      newOptions[index][field] = value;
      setOptions(newOptions);
    }
  };

  const variantList = useMemo(() => {
    const validOptions = options.filter(o => o.name.trim() !== "" && o.valuesStr.trim() !== "");
    if (validOptions.length === 0) return [];
    
    const arrays = validOptions.map(o => o.valuesStr.split(",").map(v => v.trim()).filter(Boolean));
    const isAnyEmpty = arrays.some(a => a.length === 0);
    if (isAnyEmpty) return [];

    const combinations = cartesian(arrays);
    return combinations.map(combo => {
      const title = combo.join(" / ");
      const selectedOptions = combo.map((val, idx) => ({
        name: validOptions[idx]?.name.trim() || "",
        value: val
      }));
      return { title, selectedOptions };
    });
  }, [options]);

  const handleVariantChange = (title: string, field: string, value: any) => {
    setVariantsData(prev => ({
      ...prev,
      [title]: {
        ...(prev[title] || {}),
        [field]: value
      }
    }));
  };

  const removeVariantImage = (title: string, imgIndex: number) => {
    setVariantsData(prev => {
      const current = prev[title] || {};
      const newImages = [...(current.images || [])];
      newImages.splice(imgIndex, 1);
      return {
        ...prev,
        [title]: {
          ...current,
          images: newImages
        }
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validOptions = options.filter(o => o.name.trim() !== "" && o.valuesStr.trim() !== "");
      
      const finalOptions: ProductOption[] = validOptions.length > 0 
        ? validOptions.map(o => ({
            id: o.id,
            name: o.name.trim(),
            values: o.valuesStr.split(",").map(v => v.trim()).filter(Boolean)
          }))
        : [
            {
              id: `opt-default`,
              name: "Title",
              values: ["Default Title"],
            }
          ];

      const variantsToSave: ProductVariant[] = [];
      let minPrice = Infinity;
      let maxPrice = -Infinity;
      
      const allImages: string[] = imageUrl ? [imageUrl] : [];

      if (validOptions.length > 0 && variantList.length > 0) {
        variantList.forEach((v, idx) => {
          const vData = variantsData[v.title] || {};
          const priceAmt = vData.price || "0";
          const p = Number(priceAmt);
          if (p < minPrice) minPrice = p;
          if (p > maxPrice) maxPrice = p;

          const images = (vData.images || []).map((imgUrl: string) => ({
            url: imgUrl,
            altText: v.title,
            width: 800,
            height: 800
          }));

          images.forEach((img: any) => {
            if (!allImages.includes(img.url)) allImages.push(img.url);
          });

          variantsToSave.push({
            id: `var-${Date.now()}-${idx}`,
            title: v.title,
            availableForSale: true,
            selectedOptions: v.selectedOptions,
            price: { amount: priceAmt, currencyCode: "VND" },
            compareAtPrice: vData.compareAtPrice ? { amount: vData.compareAtPrice, currencyCode: "VND" } : undefined,
            importPrice: vData.importPrice ? { amount: vData.importPrice, currencyCode: "VND" } : undefined,
            image: images.length > 0 ? images[0] : undefined,
            images: images.length > 0 ? images : undefined
          });
        });
      } else {
        // Default variant
        const defaultTitle = "Default Title";
        const vData = variantsData[defaultTitle] || {};
        const priceAmt = vData.price || "0";
        minPrice = Number(priceAmt);
        maxPrice = Number(priceAmt);

        variantsToSave.push({
          id: `var-${Date.now()}`,
          title: defaultTitle,
          availableForSale: true,
          selectedOptions: [{ name: "Title", value: "Default Title" }],
          price: { amount: priceAmt, currencyCode: "VND" },
          compareAtPrice: vData.compareAtPrice ? { amount: vData.compareAtPrice, currencyCode: "VND" } : undefined,
          importPrice: vData.importPrice ? { amount: vData.importPrice, currencyCode: "VND" } : undefined,
        });
      }

      if (minPrice === Infinity) minPrice = 0;
      if (maxPrice === -Infinity) maxPrice = 0;

      const featuredImageObj = {
        url: imageUrl || "https://placehold.co/800x800.png",
        altText: title,
        width: 800,
        height: 800,
      };

      const finalImages = [featuredImageObj, ...allImages.filter(url => url !== featuredImageObj.url).map(url => ({
        url,
        altText: title,
        width: 800,
        height: 800
      }))];

      const productData: Product = {
        id: initialData?.id || `prod-${Date.now()}`,
        handle: handle,
        title: title,
        availableForSale: availableForSale,
        description: description,
        descriptionHtml: `<p>${description}</p>`,
        options: finalOptions,
        priceRange: {
          minVariantPrice: { amount: minPrice.toString(), currencyCode: "VND" },
          maxVariantPrice: { amount: maxPrice.toString(), currencyCode: "VND" },
        },
        variants: variantsToSave,
        featuredImage: featuredImageObj,
        images: finalImages,
        seo: {
          title: title,
          description: description,
        },
        tags: initialData?.tags || [],
        updatedAt: new Date().toISOString(),
      };

      // 1. Save locally
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
      
      <div className="flex justify-between items-center pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="text-xl font-bold">Thông tin cơ bản</h2>
        <label className="flex items-center gap-2 cursor-pointer bg-neutral-100 dark:bg-neutral-800 p-2 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <span className="text-sm font-medium">Trạng thái:</span>
          <div className="relative inline-flex items-center">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={availableForSale}
              onChange={(e) => setAvailableForSale(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-600"></div>
          </div>
          <span className="text-sm font-bold text-orange-600 dark:text-orange-400 w-16">{availableForSale ? "Hiển thị" : "Đã ẩn"}</span>
        </label>
      </div>

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

        <div className="space-y-3 md:col-span-2">
          <label className="text-sm font-semibold block">Ảnh Bìa Sản Phẩm (Ảnh Chính) *</label>
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                required
                className="w-full p-2.5 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm mb-2"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="/commerce/images/products/... hoặc https://..."
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e)}
                disabled={isUploadingImage}
                className="w-full text-xs text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 dark:file:bg-orange-950 dark:file:text-orange-300"
              />
              {uploadStatus && !isUploadingImage && <p className="text-xs text-green-600 mt-1">{uploadStatus}</p>}
            </div>
            {imageUrl && (
              <img src={imageUrl} alt="Preview" className="h-24 w-24 object-cover rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm" />
            )}
          </div>
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
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold">Phân loại sản phẩm (Options)</h3>
            <p className="text-sm text-neutral-700">Tạo nhiều phân loại (VD: Kích cỡ, Màu sắc) để sinh ra các biến thể tương ứng.</p>
          </div>
          <button
            type="button"
            onClick={addOption}
            className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg text-sm font-semibold transition-colors"
          >
            + Thêm phân loại
          </button>
        </div>
        
        <div className="space-y-4">
          {options.map((opt, idx) => (
            <div key={opt.id} className="flex gap-4 items-start bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-semibold text-neutral-500">Tên phân loại</label>
                <input
                  type="text"
                  className="w-full p-2.5 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                  value={opt.name}
                  onChange={(e) => updateOption(idx, "name", e.target.value)}
                  placeholder="VD: Size"
                />
              </div>
              <div className="flex-[2] space-y-2">
                <label className="text-xs font-semibold text-neutral-500">Các giá trị (Ngăn cách bởi dấu phẩy)</label>
                <input
                  type="text"
                  className="w-full p-2.5 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                  value={opt.valuesStr}
                  onChange={(e) => updateOption(idx, "valuesStr", e.target.value)}
                  placeholder="VD: S, M, L"
                />
              </div>
              <button
                type="button"
                onClick={() => removeOption(idx)}
                className="mt-7 p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                title="Xóa phân loại này"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
              </button>
            </div>
          ))}
          {options.length === 0 && (
             <div className="p-4 text-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-500 text-sm">
               Sản phẩm hiện không có phân loại. Nếu có, hãy nhấn "+ Thêm phân loại".
             </div>
          )}
        </div>
      </div>

      <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
        <h3 className="text-lg font-bold mb-4">Danh Sách Biến Thể (Variants)</h3>
        {variantList.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-sm text-left">
              <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Phân loại</th>
                  <th className="px-4 py-3 font-semibold min-w-[120px]">Giá nhập (VND)</th>
                  <th className="px-4 py-3 font-semibold min-w-[120px]">Giá bán (VND) *</th>
                  <th className="px-4 py-3 font-semibold min-w-[120px]">Giá gốc (VND)</th>
                  <th className="px-4 py-3 font-semibold min-w-[200px]">Ảnh biến thể</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {variantList.map((v) => {
                  const vData = variantsData[v.title] || {};
                  return (
                    <tr key={v.title} className="bg-white dark:bg-neutral-900">
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{v.title}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          className="w-full p-2 rounded border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                          value={vData.importPrice || ""}
                          onChange={(e) => handleVariantChange(v.title, "importPrice", e.target.value)}
                          placeholder="Giá nhập"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          required
                          type="number"
                          className="w-full p-2 rounded border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                          value={vData.price || ""}
                          onChange={(e) => handleVariantChange(v.title, "price", e.target.value)}
                          placeholder="Giá bán"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          className="w-full p-2 rounded border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                          value={vData.compareAtPrice || ""}
                          onChange={(e) => handleVariantChange(v.title, "compareAtPrice", e.target.value)}
                          placeholder="Giá gốc"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleFileChange(e, v.title)}
                            className="w-full text-[10px] text-neutral-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 dark:file:bg-orange-950 dark:file:text-orange-300"
                          />
                          {vData.images && vData.images.length > 0 && (
                             <div className="flex flex-wrap gap-2">
                               {vData.images.map((imgUrl: string, imgIdx: number) => (
                                 <div key={imgIdx} className="relative group">
                                   <img src={imgUrl} className="w-10 h-10 object-cover rounded border border-neutral-200 dark:border-neutral-700" alt="" />
                                   <button 
                                     type="button"
                                     onClick={() => removeVariantImage(v.title, imgIdx)}
                                     className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                   >
                                     ✕
                                   </button>
                                 </div>
                               ))}
                             </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-neutral-50 dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">Sản phẩm chưa có biến thể, vui lòng nhập giá cho sản phẩm mặc định:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
              <div>
                <label className="text-xs font-semibold">Giá nhập hàng (VND)</label>
                <input
                  type="number"
                  className="w-full mt-1 p-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                  value={variantsData["Default Title"]?.importPrice || ""}
                  onChange={(e) => handleVariantChange("Default Title", "importPrice", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Giá bán (VND) *</label>
                <input
                  required
                  type="number"
                  className="w-full mt-1 p-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                  value={variantsData["Default Title"]?.price || ""}
                  onChange={(e) => handleVariantChange("Default Title", "price", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Giá gốc (VND)</label>
                <input
                  type="number"
                  className="w-full mt-1 p-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                  value={variantsData["Default Title"]?.compareAtPrice || ""}
                  onChange={(e) => handleVariantChange("Default Title", "compareAtPrice", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
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
