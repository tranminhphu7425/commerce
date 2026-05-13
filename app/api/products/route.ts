import { addProduct, deleteProduct, getAllProductsSync, updateProduct } from "lib/local";
import { NextRequest, NextResponse } from "next/server";

// GET /api/products — list all products
export async function GET() {
  const products = getAllProductsSync();
  return NextResponse.json(products);
}

// POST /api/products — add a new product
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, descriptionHtml, price, options, variants, images, tags, collections } = body;

    if (!title || !price) {
      return NextResponse.json({ error: "Title and price are required" }, { status: 400 });
    }

    const handle = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const id = `prod-${Date.now()}`;
    const currencyCode = "VND";

    const product = {
      id,
      handle,
      availableForSale: true,
      title,
      description: description || title,
      descriptionHtml: descriptionHtml || `<p>${description || title}</p>`,
      options: options || [
        { id: `opt-${Date.now()}`, name: "Size", values: ["M"] },
      ],
      priceRange: {
        maxVariantPrice: { amount: String(price), currencyCode },
        minVariantPrice: { amount: String(price), currencyCode },
      },
      variants: variants || [
        {
          id: `var-${Date.now()}`,
          title: "Default Title",
          availableForSale: true,
          selectedOptions: [{ name: "Size", value: "M" }],
          price: { amount: String(price), currencyCode },
        },
      ],
      featuredImage: images?.[0] || {
        url: "/images/products/placeholder.jpg",
        altText: title,
        width: 800,
        height: 800,
      },
      images: images || [],
      seo: { title, description: description || title },
      tags: tags || [],
      updatedAt: new Date().toISOString(),
      collections: collections || [],
    };

    addProduct(product);
    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    console.error("Error creating product:", e);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

// PUT /api/products — update a product (pass handle in body)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { handle, ...updates } = body;

    if (!handle) {
      return NextResponse.json({ error: "Handle is required" }, { status: 400 });
    }

    const updated = updateProduct(handle, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    if (!updated) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (e) {
    console.error("Error updating product:", e);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// DELETE /api/products — delete a product (pass handle in body)
export async function DELETE(req: NextRequest) {
  try {
    const { handle } = await req.json();

    if (!handle) {
      return NextResponse.json({ error: "Handle is required" }, { status: 400 });
    }

    const deleted = deleteProduct(handle);

    if (!deleted) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error deleting product:", e);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
