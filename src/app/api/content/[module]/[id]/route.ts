import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

type ModuleConfig = {
  table: string;
  allowedFields: string[];
  requiredMediaFields?: string[];
};

const modules: Record<string, ModuleConfig> = {
  slides: {
    table: "hero_slides",
    allowedFields: [
      "title",
      "subtitle",
      "image_url",
      "button_text",
      "button_link",
      "display_order",
      "is_active",
    ],
    requiredMediaFields: ["image_url"],
  },

  services: {
    table: "services",
    allowedFields: [
      "title",
      "slug",
      "summary",
      "description",
      "image_url",
      "icon",
      "display_order",
      "is_featured",
      "is_active",
    ],
  },

  products: {
    table: "products",
    allowedFields: [
      "title",
      "slug",
      "category",
      "summary",
      "description",
      "image_url",
      "features",
      "gallery_urls",
      "is_featured",
      "is_active",
    ],
  },

  projects: {
    table: "projects",
    allowedFields: [
      "title",
      "slug",
      "client",
      "location",
      "category",
      "year",
      "summary",
      "description",
      "image_url",
      "gallery_urls",
      "is_featured",
      "is_active",
    ],
  },

  news: {
    table: "news",
    allowedFields: [
      "title",
      "slug",
      "excerpt",
      "body",
      "image_url",
      "published_at",
      "is_featured",
      "is_active",
    ],
  },

  gallery: {
    table: "gallery_images",
    allowedFields: [
      "title",
      "category",
      "description",
      "image_url",
      "display_order",
      "is_active",
    ],
    requiredMediaFields: ["image_url"],
  },

  testimonials: {
    table: "testimonials",
    allowedFields: [
      "client_name",
      "company",
      "quote",
      "image_url",
      "display_order",
      "is_active",
    ],
  },

  clients: {
    table: "clients",
    allowedFields: [
      "name",
      "logo_url",
      "website",
      "display_order",
      "is_active",
    ],
  },

  downloads: {
    table: "downloads",
    allowedFields: [
      "title",
      "category",
      "description",
      "file_url",
      "display_order",
      "is_active",
    ],
  },

  vacancies: {
    table: "vacancies",
    allowedFields: [
      "title",
      "location",
      "type",
      "closing_date",
      "summary",
      "description",
      "is_active",
    ],
  },

  branches: {
    table: "branches",
    allowedFields: [
      "name",
      "address",
      "phones",
      "email",
      "map_url",
      "display_order",
      "is_active",
    ],
  },

  faqs: {
    table: "faqs",
    allowedFields: [
      "question",
      "answer",
      "keywords",
      "category",
      "display_order",
      "is_active",
    ],
  },
};

function normaliseBoolean(value: unknown) {
  return (
    value === true ||
    value === "true" ||
    value === "1" ||
    value === "on"
  );
}

function normaliseValue(field: string, value: unknown) {
  if (field === "is_active" || field === "is_featured") {
    return normaliseBoolean(value);
  }

  if (field === "display_order") {
    const numberValue = Number(value);
    return Number.isNaN(numberValue) ? 0 : numberValue;
  }

  if (field === "gallery_urls") {
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();

      if (!trimmed) {
        return [];
      }

      try {
        const parsed = JSON.parse(trimmed);

        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        return trimmed
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }

    return [];
  }

  return value;
}

function hasUsableValue(value: unknown) {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string" && value.trim() === "") {
    return false;
  }

  return true;
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      module: string;
      id: string;
    }>;
  },
) {
  try {
    const { module, id } = await context.params;
    const config = modules[module.toLowerCase()];
    const recordId = Number(id);

    if (!config) {
      return NextResponse.json(
        { error: "Invalid content module." },
        { status: 404 },
      );
    }

    if (!recordId || Number.isNaN(recordId)) {
      return NextResponse.json(
        { error: "Invalid record ID." },
        { status: 400 },
      );
    }

    const rows = await sql(
      `SELECT *
       FROM ${config.table}
       WHERE id = $1
       LIMIT 1`,
      [recordId],
    );

    if (!rows[0]) {
      return NextResponse.json(
        { error: "Content item not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Content GET item error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to retrieve content.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: {
    params: Promise<{
      module: string;
      id: string;
    }>;
  },
) {
  try {
    const { module, id } = await context.params;
    const key = module.toLowerCase();
    const config = modules[key];
    const recordId = Number(id);

    if (!config) {
      return NextResponse.json(
        { error: "Invalid content module." },
        { status: 404 },
      );
    }

    if (!recordId || Number.isNaN(recordId)) {
      return NextResponse.json(
        { error: "Invalid record ID." },
        { status: 400 },
      );
    }

    const body = await request.json();

    /*
     * Read the existing record first.
     * This allows the existing image to remain when no replacement
     * image is selected.
     */
    const existingRows = await sql(
      `SELECT *
       FROM ${config.table}
       WHERE id = $1
       LIMIT 1`,
      [recordId],
    );

    const existingItem = existingRows[0];

    if (!existingItem) {
      return NextResponse.json(
        { error: "Content item not found." },
        { status: 404 },
      );
    }

    /*
     * Compatibility with older form field names.
     */
    if (key === "products") {
      if (!body.title && body.name) {
        body.title = body.name;
      }

      if (!body.summary && body.short_description) {
        body.summary = body.short_description;
      }

      if (!body.features && body.specifications) {
        body.features = body.specifications;
      }
    }

    if (key === "projects") {
      if (!body.title && body.name) {
        body.title = body.name;
      }

      if (!body.summary && body.short_description) {
        body.summary = body.short_description;
      }
    }

    if (key === "services") {
      if (!body.summary && body.short_description) {
        body.summary = body.short_description;
      }
    }

    if (key === "news") {
      if (!body.excerpt && body.summary) {
        body.excerpt = body.summary;
      }

      if (!body.body && body.content) {
        body.body = body.content;
      }
    }

    /*
     * Preserve required media values.
     * For gallery items, image_url must never become null.
     */
    for (const field of config.requiredMediaFields || []) {
      if (!hasUsableValue(body[field])) {
        body[field] = existingItem[field];
      }
    }

    /*
     * Also preserve optional uploaded files when the form sends
     * an empty string instead of selecting a replacement.
     */
    const mediaFields = [
      "image_url",
      "logo_url",
      "file_url",
      "gallery_urls",
    ];

    for (const field of mediaFields) {
      if (
        config.allowedFields.includes(field) &&
        !hasUsableValue(body[field]) &&
        hasUsableValue(existingItem[field])
      ) {
        body[field] = existingItem[field];
      }
    }

    const fields = config.allowedFields.filter((field) => {
      return Object.prototype.hasOwnProperty.call(body, field);
    });

    if (fields.length === 0) {
      return NextResponse.json(
        { error: "No valid fields were submitted." },
        { status: 400 },
      );
    }

    const values = fields.map((field) =>
      normaliseValue(field, body[field]),
    );

    const setClause = fields
      .map((field, index) => `${field} = $${index + 1}`)
      .join(", ");

    const rows = await sql(
      `UPDATE ${config.table}
       SET ${setClause},
           updated_at = NOW()
       WHERE id = $${fields.length + 1}
       RETURNING *`,
      [...values, recordId],
    );

    if (!rows[0]) {
      return NextResponse.json(
        { error: "Content item not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Content updated successfully.",
      item: rows[0],
    });
  } catch (error) {
    console.error("Content PUT error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update content.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{
      module: string;
      id: string;
    }>;
  },
) {
  try {
    const { module, id } = await context.params;
    const config = modules[module.toLowerCase()];
    const recordId = Number(id);

    if (!config) {
      return NextResponse.json(
        { error: "Invalid content module." },
        { status: 404 },
      );
    }

    if (!recordId || Number.isNaN(recordId)) {
      return NextResponse.json(
        { error: "Invalid record ID." },
        { status: 400 },
      );
    }

    const rows = await sql(
      `DELETE FROM ${config.table}
       WHERE id = $1
       RETURNING *`,
      [recordId],
    );

    if (!rows[0]) {
      return NextResponse.json(
        { error: "Content item not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Content deleted successfully.",
      item: rows[0],
    });
  } catch (error) {
    console.error("Content DELETE error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete content.",
      },
      { status: 500 },
    );
  }
}