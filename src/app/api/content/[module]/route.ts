import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

type ModuleConfig = {
  table: string;
  allowedFields: string[];
};

const modules: Record<string, ModuleConfig> = {
 slides: {
  table: "slides",
  allowedFields: [
    "title",
    "subtitle",
    "image_url",
    "button_text",
    "button_link",
    "display_order",
    "is_active",
  ],
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
      "image_url",
      "description",
      "display_order",
      "is_active",
    ],
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

function getModuleConfig(moduleName: string): ModuleConfig | null {
  return modules[moduleName.toLowerCase()] || null;
}

function isBooleanField(field: string) {
  return field === "is_active" || field === "is_featured";
}

function isNumberField(field: string) {
  return field === "display_order";
}

function normaliseValue(field: string, value: unknown) {
  if (isBooleanField(field)) {
    return (
      value === true ||
      value === "true" ||
      value === "1" ||
      value === "on"
    );
  }

  if (isNumberField(field)) {
    if (value === "" || value === null || value === undefined) {
      return 0;
    }

    const numberValue = Number(value);

    return Number.isNaN(numberValue) ? 0 : numberValue;
  }

  if (field === "gallery_urls") {
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === "string") {
      const trimmedValue = value.trim();

      if (!trimmedValue) {
        return [];
      }

      try {
        const parsed = JSON.parse(trimmedValue);

        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        return trimmedValue
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }

    return [];
  }

  if (value === "") {
    return null;
  }

  return value;
}

function applyCompatibilityFields(
  moduleName: string,
  body: Record<string, unknown>,
) {
  const key = moduleName.toLowerCase();

  /*
   * Product compatibility:
   * Older admin forms may submit "name" instead of "title".
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

  /*
   * Project compatibility.
   */
  if (key === "projects") {
    if (!body.title && body.name) {
      body.title = body.name;
    }

    if (!body.summary && body.short_description) {
      body.summary = body.short_description;
    }

    if (!body.year && body.completion_date) {
      body.year = body.completion_date;
    }
  }

  /*
   * Service compatibility.
   */
  if (key === "services") {
    if (!body.summary && body.short_description) {
      body.summary = body.short_description;
    }
  }

  /*
   * News compatibility.
   */
  if (key === "news") {
    if (!body.excerpt && body.summary) {
      body.excerpt = body.summary;
    }

    if (!body.body && body.content) {
      body.body = body.content;
    }

    if (!body.published_at && body.publish_date) {
      body.published_at = body.publish_date;
    }
  }

  /*
   * Testimonial compatibility.
   */
  if (key === "testimonials") {
    if (!body.client_name && body.customer_name) {
      body.client_name = body.customer_name;
    }

    if (!body.quote && body.testimonial) {
      body.quote = body.testimonial;
    }
  }

  /*
   * Branch compatibility.
   */
  if (key === "branches") {
    if (!body.phones) {
      const phoneNumbers = [
        body.primary_phone,
        body.secondary_phone,
      ]
        .filter(Boolean)
        .join(" / ");

      if (phoneNumbers) {
        body.phones = phoneNumbers;
      }
    }
  }

  return body;
}

function validateRequiredFields(
  moduleName: string,
  body: Record<string, unknown>,
) {
  const key = moduleName.toLowerCase();

  const titleModules = [
    "slides",
    "services",
    "products",
    "projects",
    "news",
    "gallery",
    "downloads",
    "vacancies",
  ];

  if (titleModules.includes(key)) {
    const title = String(body.title || "").trim();

    if (!title) {
      return "Title is required.";
    }
  }

  if (key === "clients") {
    const name = String(body.name || "").trim();

    if (!name) {
      return "Client name is required.";
    }
  }

  if (key === "branches") {
    const name = String(body.name || "").trim();

    if (!name) {
      return "Branch name is required.";
    }
  }

  if (key === "testimonials") {
    const clientName = String(body.client_name || "").trim();

    if (!clientName) {
      return "Client name is required.";
    }
  }

  if (key === "faqs") {
    const question = String(body.question || "").trim();
    const answer = String(body.answer || "").trim();

    if (!question) {
      return "Question is required.";
    }

    if (!answer) {
      return "Answer is required.";
    }
  }

  return null;
}

/*
 * GET ALL CONTENT ITEMS
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ module: string }> },
) {
  try {
    const { module } = await context.params;
    const config = getModuleConfig(module);

    if (!config) {
      return NextResponse.json(
        {
          error: "Invalid content module.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * sql is called directly.
     * Do not use sql.query().
     */
    const rows = await sql(
      `SELECT *
       FROM ${config.table}
       ORDER BY id DESC
       LIMIT 500`,
      [],
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Content GET error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to retrieve content.",
      },
      {
        status: 500,
      },
    );
  }
}

/*
 * CREATE CONTENT ITEM
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ module: string }> },
) {
  try {
    const { module } = await context.params;
    const config = getModuleConfig(module);

    if (!config) {
      return NextResponse.json(
        {
          error: "Invalid content module.",
        },
        {
          status: 404,
        },
      );
    }

    const requestBody = await request.json();

    const body = applyCompatibilityFields(module, {
      ...requestBody,
    });

    const validationError = validateRequiredFields(
      module,
      body,
    );

    if (validationError) {
      return NextResponse.json(
        {
          error: validationError,
        },
        {
          status: 400,
        },
      );
    }

    const fields = config.allowedFields.filter((field) =>
      Object.prototype.hasOwnProperty.call(body, field),
    );

    if (fields.length === 0) {
      return NextResponse.json(
        {
          error: "No valid content fields were submitted.",
        },
        {
          status: 400,
        },
      );
    }

    const values = fields.map((field) =>
      normaliseValue(field, body[field]),
    );

    const placeholders = fields
      .map((_, index) => `$${index + 1}`)
      .join(", ");

    const query = `
      INSERT INTO ${config.table}
      (${fields.join(", ")})
      VALUES (${placeholders})
      RETURNING *
    `;

    const rows = await sql(query, values);

    return NextResponse.json(
      {
        success: true,
        message: "Content saved successfully.",
        item: rows[0],
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Content POST error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save content.",
      },
      {
        status: 500,
      },
    );
  }
}

/*
 * UPDATE CONTENT ITEM
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ module: string }> },
) {
  try {
    const { module } = await context.params;
    const config = getModuleConfig(module);

    if (!config) {
      return NextResponse.json(
        {
          error: "Invalid content module.",
        },
        {
          status: 404,
        },
      );
    }

    const requestBody = await request.json();

    const body = applyCompatibilityFields(module, {
      ...requestBody,
    });

    const id = Number(body.id);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        {
          error: "A valid record ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const validationError = validateRequiredFields(
      module,
      body,
    );

    if (validationError) {
      return NextResponse.json(
        {
          error: validationError,
        },
        {
          status: 400,
        },
      );
    }

    const fields = config.allowedFields.filter((field) =>
      Object.prototype.hasOwnProperty.call(body, field),
    );

    if (fields.length === 0) {
      return NextResponse.json(
        {
          error: "No valid content fields were submitted.",
        },
        {
          status: 400,
        },
      );
    }

    const values = fields.map((field) =>
      normaliseValue(field, body[field]),
    );

    const setClause = fields
      .map(
        (field, index) =>
          `${field} = $${index + 1}`,
      )
      .join(", ");

    const query = `
      UPDATE ${config.table}
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${fields.length + 1}
      RETURNING *
    `;

    /*
     * Call sql directly.
     * Do not use sql.query().
     */
    const rows = await sql(query, [...values, id]);

    if (!rows[0]) {
      return NextResponse.json(
        {
          error: "Content item was not found.",
        },
        {
          status: 404,
        },
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
      {
        status: 500,
      },
    );
  }
}

/*
 * DELETE CONTENT ITEM
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ module: string }> },
) {
  try {
    const { module } = await context.params;
    const config = getModuleConfig(module);

    if (!config) {
      return NextResponse.json(
        {
          error: "Invalid content module.",
        },
        {
          status: 404,
        },
      );
    }

    const requestBody = await request
      .json()
      .catch(() => null);

    const queryId =
      request.nextUrl.searchParams.get("id");

    const id = Number(requestBody?.id || queryId);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        {
          error: "A valid record ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const rows = await sql(
      `DELETE FROM ${config.table}
       WHERE id = $1
       RETURNING *`,
      [id],
    );

    if (!rows[0]) {
      return NextResponse.json(
        {
          error: "Content item was not found.",
        },
        {
          status: 404,
        },
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
      {
        status: 500,
      },
    );
  }
}