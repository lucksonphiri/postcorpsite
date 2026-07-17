import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProductBody = {
  id?: number | string;
  title?: string;
  slug?: string;
  category?: string;
  short_description?: string;
  description?: string;
  image_url?: string;
  featured?: boolean;
  is_active?: boolean;
  display_order?: number | string;
};

function createSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function textOrNull(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const cleanedValue = value.trim();

  return cleanedValue ? cleanedValue : null;
}

function parseBoolean(value: unknown, defaultValue = false): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true" || value === "1";
  }

  if (typeof value === "number") {
    return value === 1;
  }

  return defaultValue;
}

function parseNumber(value: unknown, defaultValue = 0): number {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue)
    ? parsedValue
    : defaultValue;
}

export async function GET() {
  try {
    const products = await sql`
      SELECT
        id,
        title,
        slug,
        category,
        short_description,
        description,
        image_url,
        featured,
        is_active,
        display_order,
        created_at,
        updated_at
      FROM products
      ORDER BY display_order ASC, id DESC
    `;

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Products GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Products could not be loaded.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ProductBody;

    const title = textOrNull(body.title);

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error: "Product title is required.",
        },
        { status: 400 }
      );
    }

    const slug =
      textOrNull(body.slug) || createSlug(title);

    const category = textOrNull(body.category);
    const shortDescription = textOrNull(
      body.short_description
    );
    const description = textOrNull(body.description);
    const imageUrl = textOrNull(body.image_url);
    const featured = parseBoolean(body.featured, false);
    const isActive = parseBoolean(body.is_active, true);
    const displayOrder = parseNumber(
      body.display_order,
      0
    );

    const existingProduct = await sql`
      SELECT id
      FROM products
      WHERE slug = ${slug}
      LIMIT 1
    `;

    if (existingProduct.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A product with the same slug already exists. Change the title or slug.",
        },
        { status: 409 }
      );
    }

    const insertedProducts = await sql`
      INSERT INTO products (
        title,
        slug,
        category,
        short_description,
        description,
        image_url,
        featured,
        is_active,
        display_order,
        created_at,
        updated_at
      )
      VALUES (
        ${title},
        ${slug},
        ${category},
        ${shortDescription},
        ${description},
        ${imageUrl},
        ${featured},
        ${isActive},
        ${displayOrder},
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    return NextResponse.json(
      {
        success: true,
        message: "Product added successfully.",
        product: insertedProducts[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Products POST error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The product could not be saved.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as ProductBody;

    const productId = parseNumber(body.id, 0);
    const title = textOrNull(body.title);

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid product ID is required.",
        },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error: "Product title is required.",
        },
        { status: 400 }
      );
    }

    const slug =
      textOrNull(body.slug) || createSlug(title);

    const category = textOrNull(body.category);
    const shortDescription = textOrNull(
      body.short_description
    );
    const description = textOrNull(body.description);
    const imageUrl = textOrNull(body.image_url);
    const featured = parseBoolean(body.featured, false);
    const isActive = parseBoolean(body.is_active, true);
    const displayOrder = parseNumber(
      body.display_order,
      0
    );

    const duplicateProduct = await sql`
      SELECT id
      FROM products
      WHERE slug = ${slug}
        AND id <> ${productId}
      LIMIT 1
    `;

    if (duplicateProduct.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Another product already uses this slug.",
        },
        { status: 409 }
      );
    }

    const updatedProducts = await sql`
      UPDATE products
      SET
        title = ${title},
        slug = ${slug},
        category = ${category},
        short_description = ${shortDescription},
        description = ${description},
        image_url = ${imageUrl},
        featured = ${featured},
        is_active = ${isActive},
        display_order = ${displayOrder},
        updated_at = NOW()
      WHERE id = ${productId}
      RETURNING *
    `;

    if (updatedProducts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product updated successfully.",
      product: updatedProducts[0],
    });
  } catch (error) {
    console.error("Products PUT error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The product could not be updated.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      id?: number | string;
    };

    const productId = parseNumber(body.id, 0);

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid product ID is required.",
        },
        { status: 400 }
      );
    }

    const deletedProducts = await sql`
      DELETE FROM products
      WHERE id = ${productId}
      RETURNING id
    `;

    if (deletedProducts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("Products DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The product could not be deleted.",
      },
      { status: 500 }
    );
  }
}