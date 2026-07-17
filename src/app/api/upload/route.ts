import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

function cleanFileName(fileName: string): string {
  const extensionIndex = fileName.lastIndexOf(".");

  const extension =
    extensionIndex >= 0
      ? fileName.substring(extensionIndex).toLowerCase()
      : "";

  const nameWithoutExtension =
    extensionIndex >= 0
      ? fileName.substring(0, extensionIndex)
      : fileName;

  const safeName = nameWithoutExtension
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${safeName || "image"}${extension}`;
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error(
        "Upload failed because BLOB_READ_WRITE_TOKEN is missing."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Vercel Blob is not configured. Add BLOB_READ_WRITE_TOKEN in Vercel and redeploy the website.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const fileValue = formData.get("file");

    if (!(fileValue instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "No image file was received.",
        },
        { status: 400 }
      );
    }

    if (fileValue.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "The selected image is empty.",
        },
        { status: 400 }
      );
    }

    if (fileValue.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "The selected image must be smaller than 10 MB.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_IMAGE_TYPES.includes(fileValue.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Only JPG, PNG, WEBP and GIF images are allowed.",
        },
        { status: 400 }
      );
    }

    const safeFileName = cleanFileName(fileValue.name);

    const pathname = [
      "products",
      `${Date.now()}-${crypto.randomUUID()}-${safeFileName}`,
    ].join("/");

    const blob = await put(pathname, fileValue, {
      access: "public",
      addRandomSuffix: false,
      contentType: fileValue.type,
    });

    return NextResponse.json(
      {
        success: true,
        url: blob.url,
        image_url: blob.url,
        pathname: blob.pathname,
        content_type: blob.contentType,
        original_name: fileValue.name,
        size: fileValue.size,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Product image upload error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The image could not be uploaded.",
      },
      { status: 500 }
    );
  }
}