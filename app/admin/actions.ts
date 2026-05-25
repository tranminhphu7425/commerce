"use server";

import { addProduct, deleteProduct, updateProduct } from "lib/local";
import { Product } from "lib/local/types";
import { revalidatePath } from "next/cache";

export async function createProductAction(product: Product & { collections?: string[] }) {
  try {
    addProduct(product);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to create product:", error);
    return { success: false, error: "Lỗi khi lưu sản phẩm" };
  }
}

export async function updateProductAction(handle: string, updates: Partial<Product & { collections?: string[] }>) {
  try {
    updateProduct(handle, updates);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to update product:", error);
    return { success: false, error: "Lỗi khi cập nhật sản phẩm" };
  }
}

export async function deleteProductAction(handle: string) {
  try {
    const success = deleteProduct(handle);
    if (success) {
      revalidatePath("/");
      return { success: true };
    }
    return { success: false, error: "Sản phẩm không tồn tại" };
  } catch (error) {
    console.error("Failed to delete product:", error);
    return { success: false, error: "Lỗi khi xóa sản phẩm" };
  }
}
