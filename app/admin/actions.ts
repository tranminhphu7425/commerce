import { Product } from "lib/local/types";

export async function createProductAction(product: Product & { collections?: string[] }): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function updateProductAction(handle: string, updates: Partial<Product & { collections?: string[] }>): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function deleteProductAction(handle: string): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}
