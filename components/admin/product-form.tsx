"use client";

import { createProductAction, updateProductAction } from "app/admin/actions";
import { saveLocalProductOverride, savePendingImage } from "lib/local/client-store";
import { getImageCache, useCachedImageUrl } from "lib/local/image-cache";
import { Product, ProductOption, ProductVariant } from "lib/local/types";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

// Drag and Drop Upload Zone Component
function DropZone({
  onFilesSelected,
  multiple = true,
  disabled = false,
  label = "Kéo & thả file ảnh vào đây, hoặc click để chọn file",
  sublabel = "Hỗ trợ định dạng JPG, PNG, WEBP, AVIF",
}: {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  label?: string;
  sublabel?: string;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragOver(true);
    } else if (e.type === "dragleave") {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArr = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (filesArr.length > 0) {
        onFilesSelected(filesArr);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer text-center ${disabled
          ? "opacity-50 cursor-not-allowed border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800"
          : isDragOver
            ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30 scale-[0.99]"
            : "border-neutral-300 dark:border-neutral-700 hover:border-orange-400 bg-neutral-50/50 dark:bg-neutral-900/50 hover:bg-orange-50/30 dark:hover:bg-orange-950/10"
        }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />
      <div className="w-10 h-10 mb-2 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
        </svg>
      </div>
      <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{label}</p>
      {sublabel && <p className="text-[11px] text-neutral-400 mt-1">{sublabel}</p>}
    </div>
  );
}

// Image Preview Component with Cache & Fallback
function FormImagePreview({
  src,
  alt,
  className,
  isFeatured = false,
  onSetFeatured,
  onRemove,
}: {
  src: string;
  alt?: string;
  className?: string;
  isFeatured?: boolean;
  onSetFeatured?: () => void;
  onRemove?: () => void;
}) {
  const cachedSrc = useCachedImageUrl(src);
  const [fallbackSrc, setFallbackSrc] = useState<string | null>(null);

  // Directly resolve Data URL from getImageCache before falling back to raw src
  const displaySrc = fallbackSrc || cachedSrc || getImageCache(src) || src;

  return (
    <div className={`relative group overflow-hidden rounded-xl border transition-all ${isFeatured ? "border-orange-500 ring-2 ring-orange-500/30" : "border-neutral-200 dark:border-neutral-700"}`}>
      <img
        src={displaySrc}
        alt={alt || "Preview"}
        className={className || "h-24 w-24 object-cover"}
        onError={(e) => {
          const cached = getImageCache(src);
          if (cached && e.currentTarget.src !== cached) {
            setFallbackSrc(cached);
            e.currentTarget.src = cached;
          }
        }}
      />
      {isFeatured && (
        <span className="absolute top-1 left-1 bg-orange-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
          ★ Bìa
        </span>
      )}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
        {!isFeatured && onSetFeatured && (
          <button
            type="button"
            onClick={onSetFeatured}
            className="bg-white/90 dark:bg-neutral-800 text-neutral-800 dark:text-white hover:bg-orange-500 hover:text-white text-[10px] font-bold px-1.5 py-1 rounded transition-colors"
            title="Đặt làm ảnh bìa"
          >
            ★ Bìa
          </button>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-1 rounded hover:bg-red-600 transition-colors"
            title="Xóa ảnh này"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

// Pill Tags Preview Component for Options
function OptionPillTags({ valuesStr }: { valuesStr: string }) {
  if (!valuesStr.trim()) return null;
  const values = valuesStr
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  if (values.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {values.map((val, i) => (
        <span
          key={i}
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-900/50"
        >
          {val}
        </span>
      ))}
    </div>
  );
}

// Helper to compress image file and convert to optimized Base64 Data URL
const compressImageFile = (
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<string> => {
  return new Promise((resolve) => {
    if (file.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        } else {
          resolve((e.target?.result as string) || "");
        }
      };
      img.onerror = () => resolve((e.target?.result as string) || "");
      img.src = (e.target?.result as string) || "";
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
};

const readFileAsDataUrl = (file: File): Promise<string> => {
  return compressImageFile(file);
};

// Helper to generate cartesian product of option values
const cartesian = (arrays: string[][]): string[][] => {
  if (arrays.length === 0) return [];
  return arrays.reduce((acc, curr) => {
    if (curr.length === 0) return acc;
    if (acc.length === 0) return curr.map((c) => [c]);
    return acc.flatMap((a) => curr.map((c) => [...a, c]));
  }, [] as string[][]);
};

// Helper to format number string with dots as thousand separators
const formatNumberString = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null) return "";
  const str = typeof value === "number" ? value.toString() : value;
  const clean = str.replace(/\D/g, "");
  if (!clean) return "";
  return new Intl.NumberFormat("vi-VN").format(Number(clean));
};

// Helper to clean price inputs and strip non-digits
const cleanPriceInput = (value: string): string => {
  return value.replace(/\D/g, "");
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
  const [galleryImages, setGalleryImages] = useState<string[]>(() => {
    if (!initialData?.images) return [];
    const featUrl = initialData.featuredImage?.url;
    return initialData.images.map((img) => img.url).filter((url) => url !== featUrl);
  });
  const [availableForSale, setAvailableForSale] = useState(
    initialData?.availableForSale ?? true
  );

  // Options
  const [options, setOptions] = useState<{ id: string; name: string; valuesStr: string }[]>(
    initialData?.options && initialData.options.length > 0 && initialData.options[0]?.name !== "Title"
      ? initialData.options.map((o, i) => ({
        id: o.id || `opt-${i}`,
        name: o.name,
        valuesStr: o.values.join(", "),
      }))
      : []
  );

  // Variants
  const [variantsData, setVariantsData] = useState<Record<string, any>>(() => {
    const vData: Record<string, any> = {};
    if (initialData?.variants) {
      initialData.variants.forEach((v) => {
        vData[v.title] = {
          price: v.price?.amount || "",
          compareAtPrice: v.compareAtPrice?.amount || "",
          importPrice: v.importPrice?.amount || "",
          images: v.images?.map((img) => img.url) || (v.image ? [v.image.url] : []),
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

  // Process files for featured or variant images
  const processUploadedFiles = async (files: File[], variantTitle?: string) => {
    if (!files || files.length === 0) return;

    const generatedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file) {
        const timestamp = Date.now();
        const cleanFileName = file.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9.]+/g, "-");
        const filename = `${timestamp}-${cleanFileName}`;
        const relativeUrl = `/commerce/images/products/${filename}`;

        // Compress image to ~150KB Base64
        const dataUrl = await compressImageFile(file);

        // Stage file in localStorage pending images list & image cache
        savePendingImage(filename, dataUrl);

        generatedUrls.push(relativeUrl);
      }
    }

    if (variantTitle) {
      setVariantsData((prev) => {
        const current = prev[variantTitle] || {};
        return {
          ...prev,
          [variantTitle]: {
            ...current,
            images: [...(current.images || []), ...generatedUrls],
          },
        };
      });
    } else {
      if (generatedUrls.length > 0 && generatedUrls[0]) {
        setImageUrl(generatedUrls[0]);
      }
    }

    toast.success(`Đã lưu tạm ${generatedUrls.length} ảnh vào trình duyệt`);
  };

  // Process gallery files
  const processGalleryFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;

    const generatedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file) {
        const timestamp = Date.now();
        const cleanFileName = file.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9.]+/g, "-");
        const filename = `${timestamp}-${cleanFileName}`;
        const relativeUrl = `/commerce/images/products/${filename}`;

        const dataUrl = await compressImageFile(file);

        savePendingImage(filename, dataUrl);

        generatedUrls.push(relativeUrl);
      }
    }

    setGalleryImages((prev) => [...prev, ...generatedUrls]);
    toast.success(`Đã lưu tạm ${generatedUrls.length} ảnh bộ sưu tập vào trình duyệt`);
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  const setAsFeaturedImage = (targetUrl: string) => {
    if (targetUrl === imageUrl) return;
    const oldFeatured = imageUrl;
    setImageUrl(targetUrl);

    // Swap old featured into gallery if exists
    if (oldFeatured) {
      setGalleryImages((prev) => {
        const filtered = prev.filter((u) => u !== targetUrl);
        return [oldFeatured, ...filtered];
      });
    } else {
      setGalleryImages((prev) => prev.filter((u) => u !== targetUrl));
    }
    toast.success("★ Đã đặt làm ảnh bìa chính sản phẩm!");
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
    const validOptions = options.filter(
      (o) => o.name.trim() !== "" && o.valuesStr.trim() !== ""
    );
    if (validOptions.length === 0) return [];

    const arrays = validOptions.map((o) =>
      o.valuesStr
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    );
    const isAnyEmpty = arrays.some((a) => a.length === 0);
    if (isAnyEmpty) return [];

    const combinations = cartesian(arrays);
    return combinations.map((combo) => {
      const title = combo.join(" / ");
      const selectedOptions = combo.map((val, idx) => ({
        name: validOptions[idx]?.name.trim() || "",
        value: val,
      }));
      return { title, selectedOptions };
    });
  }, [options]);

  const handleVariantChange = (title: string, field: string, value: any) => {
    setVariantsData((prev) => ({
      ...prev,
      [title]: {
        ...(prev[title] || {}),
        [field]: value,
      },
    }));
  };

  const removeVariantImage = (title: string, imgIndex: number) => {
    setVariantsData((prev) => {
      const current = prev[title] || {};
      const newImages = [...(current.images || [])];
      newImages.splice(imgIndex, 1);
      return {
        ...prev,
        [title]: {
          ...current,
          images: newImages,
        },
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      toast.error("Vui lòng chọn hoặc tải ảnh bìa sản phẩm!");
      return;
    }
    setIsSubmitting(true);

    try {
      const validOptions = options.filter(
        (o) => o.name.trim() !== "" && o.valuesStr.trim() !== ""
      );

      const finalOptions: ProductOption[] =
        validOptions.length > 0
          ? validOptions.map((o) => ({
            id: o.id,
            name: o.name.trim(),
            values: o.valuesStr
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean),
          }))
          : [
            {
              id: `opt-default`,
              name: "Title",
              values: ["Default Title"],
            },
          ];

      const variantsToSave: ProductVariant[] = [];
      let minPrice = Infinity;
      let maxPrice = -Infinity;

      const allImages: string[] = imageUrl ? [imageUrl] : [];
      galleryImages.forEach((url) => {
        if (url && !allImages.includes(url)) allImages.push(url);
      });

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
            height: 800,
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
            compareAtPrice: vData.compareAtPrice
              ? { amount: vData.compareAtPrice, currencyCode: "VND" }
              : undefined,
            importPrice: vData.importPrice
              ? { amount: vData.importPrice, currencyCode: "VND" }
              : undefined,
            image: images.length > 0 ? images[0] : undefined,
            images: images.length > 0 ? images : undefined,
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
          compareAtPrice: vData.compareAtPrice
            ? { amount: vData.compareAtPrice, currencyCode: "VND" }
            : undefined,
          importPrice: vData.importPrice
            ? { amount: vData.importPrice, currencyCode: "VND" }
            : undefined,
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

      const finalImages = [
        featuredImageObj,
        ...allImages
          .filter((url) => url !== featuredImageObj.url)
          .map((url) => ({
            url,
            altText: title,
            width: 800,
            height: 800,
          })),
      ];

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

      // 1. Save locally to localStorage (Instant Staging)
      saveLocalProductOverride(productData, initialData?.handle);
      if (initialData) {
        await updateProductAction(initialData.handle, productData);
      } else {
        await createProductAction(productData);
      }

      toast.success(
        `🎉 Đã lưu tạm sản phẩm "${title}" vào trình duyệt! Hãy bấm "Lưu thay đổi" ở trang Admin để cập nhật lên Server.`
      );

      router.push("/admin");
    } catch (error) {
      console.error(error);
      toast.error("Đã xảy ra lỗi hệ thống khi lưu sản phẩm");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-24">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {initialData ? "Chỉnh Sửa Sản Phẩm" : "Tạo Sản Phẩm Mới"}
          </h1>
          <p className="text-xs text-neutral-700 dark:text-neutral-400 mt-1">
            {initialData
              ? `Cập nhật thông tin và hình ảnh cho "${initialData.title}"`
              : "Thêm sản phẩm mới vào cửa hàng của bạn"}
          </p>
        </div>
        <label className="flex items-center gap-3 cursor-pointer bg-neutral-50 dark:bg-neutral-800 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700">
          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Trạng thái bán:
          </span>
          <div className="relative inline-flex items-center">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={availableForSale}
              onChange={(e) => setAvailableForSale(e.target.checked)}
            />
            <div className="w-10 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-empty after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-orange-600"></div>
          </div>
          <span
            className={`text-xs font-bold w-16 ${availableForSale
                ? "text-green-600 dark:text-green-400"
                : "text-neutral-400"
              }`}
          >
            {availableForSale ? "✓ Hiển thị" : "Đã ẩn"}
          </span>
        </label>
      </div>

      {/* Card 1: Thông tin cơ bản */}
      <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4">
          <span className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-sm">
            1
          </span>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            Thông Tin Cơ Bản
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              Tên sản phẩm *
            </label>
            <input
              required
              type="text"
              className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:border-orange-500 focus:outline-none transition-colors"
              value={title}
              onChange={handleTitleChange}
              placeholder="Ví dụ: Máy đứng Titan Special 3000"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              Đường dẫn (URL Handle) *
            </label>
            <input
              required
              type="text"
              className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:border-orange-500 focus:outline-none transition-colors"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="may-dung-titan-special-3000"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              Mô tả chi tiết sản phẩm
            </label>
            <textarea
              rows={4}
              className="w-full p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:border-orange-500 focus:outline-none transition-colors"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả chi tiết về thông số kỹ thuật, chất liệu, ứng dụng của sản phẩm..."
            />
          </div>
        </div>
      </div>

      {/* Card 2: Thư viện hình ảnh */}
      <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-sm">
              2
            </span>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                Bộ Sưu Tập Hình Ảnh
              </h2>
              <p className="text-xs text-neutral-700 dark:text-neutral-400">
                Kéo thả file để tải ảnh lên. Nhấp vào ảnh bất kỳ để đặt làm **Ảnh Bìa Chính**.
              </p>
            </div>
          </div>
        </div>

        {uploadStatus && !isUploadingImage && (
          <div className="p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-300 rounded-xl text-xs flex items-center gap-2">
            <span>✓</span> {uploadStatus}
          </div>
        )}

        <DropZone
          onFilesSelected={(files) => processGalleryFiles(files)}
          disabled={isUploadingImage}
          label="Kéo & thả file ảnh vào đây, hoặc click để tải lên bộ sưu tập"
          sublabel="Tải lên ảnh chính và ảnh các góc độ khác (mặt sau, chi tiết...)"
        />

        {/* Gallery Grid Display */}
        {(imageUrl || galleryImages.length > 0) && (
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              Danh sách ảnh đã tải ({(imageUrl ? 1 : 0) + galleryImages.length} ảnh)
            </label>
            <div className="flex flex-wrap gap-4">
              {/* Featured Main Cover Image */}
              {imageUrl && (
                <FormImagePreview
                  src={imageUrl}
                  alt="Ảnh Bìa Chính"
                  isFeatured={true}
                  className="h-28 w-28 object-cover rounded-xl"
                  onRemove={() => {
                    if (galleryImages.length > 0) {
                      const newFeat = galleryImages[0]!;
                      setImageUrl(newFeat);
                      setGalleryImages((prev) => prev.slice(1));
                    } else {
                      setImageUrl("");
                    }
                  }}
                />
              )}

              {/* Gallery Images */}
              {galleryImages.map((imgUrl, imgIdx) => (
                <FormImagePreview
                  key={imgIdx}
                  src={imgUrl}
                  alt={`Ảnh ${imgIdx + 1}`}
                  isFeatured={false}
                  className="h-28 w-28 object-cover rounded-xl cursor-pointer"
                  onSetFeatured={() => setAsFeaturedImage(imgUrl)}
                  onRemove={() => removeGalleryImage(imgIdx)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Card 3: Phân loại sản phẩm (Options) */}
      <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-6">
        <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-sm">
              3
            </span>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                Phân Loại Sản Phẩm (Options)
              </h2>
              <p className="text-xs text-neutral-700 dark:text-neutral-400">
                Tạo các tùy chọn như Kích cỡ (S, M, L) hoặc Màu sắc (Đỏ, Xanh) để sinh ra biến thể.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={addOption}
            className="px-4 py-2 bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/60 border border-orange-200 dark:border-orange-900/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span>+</span> Thêm phân loại
          </button>
        </div>

        <div className="space-y-4">
          {options.map((opt, idx) => (
            <div
              key={opt.id}
              className="flex flex-col sm:flex-row gap-4 items-start bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700/60"
            >
              <div className="w-full sm:w-1/3 space-y-1.5">
                <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                  Tên phân loại
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                  value={opt.name}
                  onChange={(e) => updateOption(idx, "name", e.target.value)}
                  placeholder="VD: Kích thước, Màu sắc..."
                />
              </div>
              <div className="w-full sm:flex-1 space-y-1.5">
                <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                  Các giá trị (Phân cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                  value={opt.valuesStr}
                  onChange={(e) => updateOption(idx, "valuesStr", e.target.value)}
                  placeholder="VD: 3000, 4000, 5000"
                />
                <OptionPillTags valuesStr={opt.valuesStr} />
              </div>
              <button
                type="button"
                onClick={() => removeOption(idx)}
                className="self-end sm:self-center mt-2 sm:mt-5 p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                title="Xóa phân loại này"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
              </button>
            </div>
          ))}
          {options.length === 0 && (
            <div className="p-6 text-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-700 dark:text-neutral-400 text-xs space-y-2">
              <p className="font-semibold">Sản phẩm chưa có phân loại (Ví dụ: Size, Màu sắc).</p>
              <p className="text-neutral-400">
                Nếu sản phẩm có nhiều biến thể, hãy nhấn nút <strong>"+ Thêm phân loại"</strong> ở trên.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Card 4: Giá bán & Biến thể */}
      <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4">
          <span className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-sm">
            4
          </span>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            Giá Bán & Các Biến Thể (Variants)
          </h2>
        </div>

        {variantList.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 whitespace-nowrap">Biến thể</th>
                  <th className="px-4 py-3.5 min-w-[130px]">Giá nhập (VND)</th>
                  <th className="px-4 py-3.5 min-w-[130px]">Giá bán (VND) *</th>
                  <th className="px-4 py-3.5 min-w-[130px]">Giá gốc (VND)</th>
                  <th className="px-4 py-3.5 min-w-[200px]">Ảnh riêng cho biến thể</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {variantList.map((v) => {
                  const vData = variantsData[v.title] || {};
                  return (
                    <tr
                      key={v.title}
                      className="bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                    >
                      <td className="px-4 py-3.5 font-bold text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                        {v.title}
                      </td>
                      <td className="px-4 py-3.5">
                        <input
                          type="text"
                          inputMode="numeric"
                          className="w-full p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs"
                          value={formatNumberString(vData.importPrice || "")}
                          onChange={(e) =>
                            handleVariantChange(v.title, "importPrice", cleanPriceInput(e.target.value))
                          }
                          placeholder="Giá nhập"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <input
                          required
                          type="text"
                          inputMode="numeric"
                          className="w-full p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:border-orange-500"
                          value={formatNumberString(vData.price || "")}
                          onChange={(e) =>
                            handleVariantChange(v.title, "price", cleanPriceInput(e.target.value))
                          }
                          placeholder="Giá bán *"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <input
                          type="text"
                          inputMode="numeric"
                          className="w-full p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs"
                          value={formatNumberString(vData.compareAtPrice || "")}
                          onChange={(e) =>
                            handleVariantChange(
                              v.title,
                              "compareAtPrice",
                              cleanPriceInput(e.target.value)
                            )
                          }
                          placeholder="Giá gốc"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="space-y-2">
                          <DropZone
                            onFilesSelected={(files) =>
                              processUploadedFiles(files, v.title)
                            }
                            disabled={isUploadingImage}
                            label="Tải ảnh biến thể"
                            sublabel=""
                          />
                          {vData.images && vData.images.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {vData.images.map((imgUrl: string, imgIdx: number) => (
                                <div key={imgIdx} className="relative group">
                                  <FormImagePreview
                                    src={imgUrl}
                                    className="w-12 h-12 object-cover rounded-lg border border-neutral-200 dark:border-neutral-700"
                                    alt=""
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeVariantImage(v.title, imgIdx)
                                    }
                                    className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow"
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
          <div className="bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700/60">
            <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-4">
              Sản phẩm chưa có phân loại. Vui lòng nhập giá bán cho sản phẩm mặc định:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Giá nhập hàng (VND)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full mt-1.5 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                  value={formatNumberString(variantsData["Default Title"]?.importPrice || "")}
                  onChange={(e) =>
                    handleVariantChange("Default Title", "importPrice", cleanPriceInput(e.target.value))
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Giá bán (VND) *
                </label>
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  className="w-full mt-1.5 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-bold text-orange-600 dark:text-orange-400 focus:border-orange-500"
                  value={formatNumberString(variantsData["Default Title"]?.price || "")}
                  onChange={(e) =>
                    handleVariantChange("Default Title", "price", cleanPriceInput(e.target.value))
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Giá gốc niêm yết (VND)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full mt-1.5 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                  value={formatNumberString(variantsData["Default Title"]?.compareAtPrice || "")}
                  onChange={(e) =>
                    handleVariantChange(
                      "Default Title",
                      "compareAtPrice",
                      cleanPriceInput(e.target.value)
                    )
                  }
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating / Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 p-4 shadow-xl">
        <div className="max-w-5xl mx-auto flex justify-between items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-xl font-bold text-xs text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all"
          >
            ← Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold text-xs hover:bg-orange-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-orange-600/30 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <span>✓</span>
            )}
            {initialData ? "Lưu Thay Đổi Sản Phẩm" : "Tạo Sản Phẩm Mới"}
          </button>
        </div>
      </div>
    </form>
  );
}
