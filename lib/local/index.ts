import fs from "fs";
import path from "path";
import type {
  Cart,
  CartItem,
  Collection,
  Menu,
  Page,
  Product,
} from "./types";

// Re-export all types so other files can import from "lib/local"
export type {
  Cart,
  CartItem,
  Collection,
  Menu,
  Page,
  Product,
  Image,
  Money,
  ProductOption,
  ProductVariant,
  SEO,
  CartProduct,
  Connection,
  Edge,
} from "./types";

// --- Data file path ---
const DATA_FILE = path.join(process.cwd(), "data", "store.json");

type StoreData = {
  products: (Product & { collections?: string[] })[];
  collections: Omit<Collection, "path">[];
  menus: {
    header: Menu[];
    footer: Menu[];
  };
};

function cleanProductImageUrls(products: any[], basePath: string): any[] {
  if (basePath === "") {
    products.forEach((p: any) => {
      if (p.featuredImage?.url?.startsWith("/commerce/")) {
        p.featuredImage.url = p.featuredImage.url.replace(/^\/commerce/, "");
      }
      if (Array.isArray(p.images)) {
        p.images.forEach((img: any) => {
          if (img?.url?.startsWith("/commerce/")) {
            img.url = img.url.replace(/^\/commerce/, "");
          }
        });
      }
      if (Array.isArray(p.variants)) {
        p.variants.forEach((v: any) => {
          if (v.image?.url?.startsWith("/commerce/")) {
            v.image.url = v.image.url.replace(/^\/commerce/, "");
          }
          if (Array.isArray(v.images)) {
            v.images.forEach((img: any) => {
              if (img?.url?.startsWith("/commerce/")) {
                img.url = img.url.replace(/^\/commerce/, "");
              }
            });
          }
        });
      }
    });
  }
  return products;
}

function readStore(): StoreData {
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  const data = JSON.parse(raw);
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/commerce";
  if (data && Array.isArray(data.products)) {
    data.products = cleanProductImageUrls(data.products, basePath);
  }
  return data;
}

function writeStore(data: StoreData): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// --- Products ---

export async function getProducts({
  query,
  reverse,
  sortKey,
}: {
  query?: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  const store = readStore();
  let products = [...store.products];

  // Filter by search query
  if (query) {
    const q = query.toLowerCase();
    products = products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  // Sort
  if (sortKey) {
    switch (sortKey) {
      case "PRICE":
        products.sort((a, b) => {
          const priceA = Number(a.priceRange.minVariantPrice.amount);
          const priceB = Number(b.priceRange.minVariantPrice.amount);
          return priceA - priceB;
        });
        break;
      case "BEST_SELLING":
        // No real sales data, keep original order
        break;
      case "CREATED_AT":
        products.sort(
          (a, b) =>
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
        );
        break;
      case "RELEVANCE":
      default:
        break;
    }
  }

  if (reverse) {
    products.reverse();
  }

  return products;
}

export async function getProduct(
  handle: string,
): Promise<Product | undefined> {
  const store = readStore();
  return store.products.find((p) => p.handle === handle);
}

export async function getProductRecommendations(
  productId: string,
): Promise<Product[]> {
  const store = readStore();
  const current = store.products.find((p) => p.id === productId);
  if (!current) return [];

  // Recommend products from the same collections, excluding the current one
  const currentCollections = (current as any).collections || [];
  return store.products
    .filter(
      (p) =>
        p.id !== productId &&
        ((p as any).collections || []).some((c: string) =>
          currentCollections.includes(c),
        ),
    )
    .slice(0, 4);
}

// --- Collections ---

export async function getCollections(): Promise<Collection[]> {
  const store = readStore();
  return [
    {
      handle: "",
      title: "Tất cả",
      description: "Tất cả sản phẩm",
      seo: { title: "Tất cả", description: "Tất cả sản phẩm" },
      path: "/search",
      updatedAt: new Date().toISOString(),
    },
    ...store.collections.map((c) => ({
      ...c,
      path: `/search/${c.handle}`,
    })),
  ];
}

export async function getCollection(
  handle: string,
): Promise<Collection | undefined> {
  const store = readStore();
  const collection = store.collections.find((c) => c.handle === handle);
  if (!collection) return undefined;
  return {
    ...collection,
    path: `/search/${collection.handle}`,
  };
}

export async function getCollectionProducts({
  collection,
  reverse,
  sortKey,
}: {
  collection: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  const store = readStore();

  let products = store.products.filter((p) =>
    ((p as any).collections || []).includes(collection),
  );

  // Sort
  if (sortKey) {
    switch (sortKey) {
      case "PRICE":
        products.sort((a, b) => {
          const priceA = Number(a.priceRange.minVariantPrice.amount);
          const priceB = Number(b.priceRange.minVariantPrice.amount);
          return priceA - priceB;
        });
        break;
      case "CREATED_AT":
        products.sort(
          (a, b) =>
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
        );
        break;
      default:
        break;
    }
  }

  if (reverse) {
    products.reverse();
  }

  return products;
}

// --- Menu ---

export async function getMenu(handle: string): Promise<Menu[]> {
  const store = readStore();
  if (handle.includes("header")) {
    return store.menus.header || [];
  }
  if (handle.includes("footer")) {
    return store.menus.footer || [];
  }
  return [];
}

// --- Pages ---

export async function getPage(handle: string): Promise<Page> {
  // Return a simple page since we don't have a CMS
  return {
    id: handle,
    title: handle.charAt(0).toUpperCase() + handle.slice(1),
    handle,
    body: "",
    bodySummary: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function getPages(): Promise<Page[]> {
  return [];
}

// --- Cart (server-side helpers for cookie-based cart) ---

export async function createCart(): Promise<Cart> {
  return {
    id: `cart-${Date.now()}`,
    checkoutUrl: "/checkout",
    totalQuantity: 0,
    lines: [],
    cost: {
      subtotalAmount: { amount: "0", currencyCode: "VND" },
      totalAmount: { amount: "0", currencyCode: "VND" },
     
    },
  };
}

export async function getCart(): Promise<Cart | undefined> {
  // Cart is managed client-side via CartContext
  // Return undefined so CartContext creates an empty cart
  return undefined;
}

export async function addToCart(
  lines: { merchandiseId: string; quantity: number }[],
): Promise<Cart> {
  // This is handled client-side via optimistic updates in CartContext
  // Server action just returns a placeholder
  return createCart();
}

export async function removeFromCart(lineIds: string[]): Promise<Cart> {
  return createCart();
}

export async function updateCart(
  lines: { id: string; merchandiseId: string; quantity: number }[],
): Promise<Cart> {
  return createCart();
}

// --- Admin: CRUD operations for products ---

export function getAllProductsSync(): (Product & { collections?: string[] })[] {
  const store = readStore();
  return store.products;
}

export function addProduct(
  product: Product & { collections?: string[] },
): void {
  const store = readStore();
  store.products.push(product);
  writeStore(store);
}

export function updateProduct(
  handle: string,
  updates: Partial<Product & { collections?: string[] }>,
): Product | undefined {
  const store = readStore();
  const index = store.products.findIndex((p) => p.handle === handle);
  if (index === -1) return undefined;

  store.products[index] = { ...store.products[index]!, ...updates };
  writeStore(store);
  return store.products[index];
}

export function deleteProduct(handle: string): boolean {
  const store = readStore();
  const index = store.products.findIndex((p) => p.handle === handle);
  if (index === -1) return false;

  store.products.splice(index, 1);
  writeStore(store);
  return true;
}

// --- Admin: CRUD operations for collections ---

export function addCollection(
  collection: Omit<Collection, "path">,
): void {
  const store = readStore();
  store.collections.push(collection);
  writeStore(store);
}

export function deleteCollection(handle: string): boolean {
  const store = readStore();
  const index = store.collections.findIndex((c) => c.handle === handle);
  if (index === -1) return false;

  store.collections.splice(index, 1);
  writeStore(store);
  return true;
}
