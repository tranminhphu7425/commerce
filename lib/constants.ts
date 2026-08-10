export type SortFilterItem = {
  title: string;
  slug: string | null;
  sortKey: "RELEVANCE" | "BEST_SELLING" | "CREATED_AT" | "PRICE";
  reverse: boolean;
};

export const defaultSort: SortFilterItem = {
  title: "Mặc định",
  slug: null,
  sortKey: "RELEVANCE",
  reverse: false,
};

export const sorting: SortFilterItem[] = [
  defaultSort,
  {
    title: "Phổ biến",
    slug: "trending-desc",
    sortKey: "BEST_SELLING",
    reverse: false,
  }, // asc
  {
    title: "Mới nhất",
    slug: "latest-desc",
    sortKey: "CREATED_AT",
    reverse: true,
  },
  {
    title: "Giá: Thấp đến Cao",
    slug: "price-asc",
    sortKey: "PRICE",
    reverse: false,
  }, // asc
  {
    title: "Giá: Cao đến Thấp",
    slug: "price-desc",
    sortKey: "PRICE",
    reverse: true,
  },
];

export const TAGS = {
  collections: "collections",
  products: "products",
  cart: "cart",
};

export const HIDDEN_PRODUCT_TAG = "nextjs-frontend-hidden";
export const DEFAULT_OPTION = "Default Title";
export const SHOPIFY_GRAPHQL_API_ENDPOINT = "/api/2023-01/graphql.json";

export const CONTACT_INFO = {
  phone: "0348667831",
  zalo: "0348667831",
  messenger: "chiToan434",
  tiktok: "https://www.tiktok.com/@chi_toan_fishing_",
  shopee: "https://shopee.vn/shopdocauchitoanfishing",
  bankId: "VCB",
  accountNo: "9911550054",
  accountName: "TRẦN MINH PHÚ",
  name: "CHÍ TOÀN FISHING SHOP",
};
