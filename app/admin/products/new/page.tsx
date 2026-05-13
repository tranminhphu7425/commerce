"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    description: "",
    tags: "",
    collections: "featured",
    imageUrl: "",
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append("file", file);

    setLoading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });
      const result = await res.json();
      if (result.url) {
        setFormData((prev) => ({ ...prev, imageUrl: result.url }));
      }
    } catch (err) {
      alert("Lỗi upload ảnh");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      price: Number(formData.price),
      tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
      collections: formData.collections.split(",").map((c) => c.trim()).filter(Boolean),
      images: formData.imageUrl ? [{
        url: formData.imageUrl,
        altText: formData.title,
        width: 800,
        height: 800
      }] : []
    };

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || "Lỗi khi lưu sản phẩm");
      }
    } catch (err) {
      alert("Lỗi hệ thống");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-8">
        <Link href="/admin" className="text-blue-600 hover:underline mb-2 block">
          ← Quay lại danh sách
        </Link>
        <h1 className="text-3xl font-bold">Thêm sản phẩm mới</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-neutral-900 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <div>
          <label className="block mb-2 font-medium">Tên sản phẩm</label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded dark:bg-neutral-800 dark:border-neutral-700"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ví dụ: Áo thun cổ tròn"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Giá (VND)</label>
          <input
            type="number"
            required
            className="w-full p-2 border rounded dark:bg-neutral-800 dark:border-neutral-700"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="Ví dụ: 250000"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Hình ảnh</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="mb-4 block"
          />
          {formData.imageUrl && (
            <div className="relative w-32 h-32 border rounded overflow-hidden">
              <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div>
          <label className="block mb-2 font-medium">Mô tả</label>
          <textarea
            rows={4}
            className="w-full p-2 border rounded dark:bg-neutral-800 dark:border-neutral-700"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Danh mục (phân cách bởi dấu phẩy)</label>
          <input
            type="text"
            className="w-full p-2 border rounded dark:bg-neutral-800 dark:border-neutral-700"
            value={formData.collections}
            onChange={(e) => setFormData({ ...formData, collections: e.target.value })}
            placeholder="featured, ao-thun, quan-jean"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Tags (phân cách bởi dấu phẩy)</label>
          <input
            type="text"
            className="w-full p-2 border rounded dark:bg-neutral-800 dark:border-neutral-700"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="hot, sale, basic"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-md font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Đang xử lý..." : "Lưu sản phẩm"}
        </button>
      </form>
    </div>
  );
}
