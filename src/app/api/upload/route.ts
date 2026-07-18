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
      ? fileName.slice(extensionIndex).toLowerCase()
      : "";

  const baseName =
    extensionIndex >= 0
      ? fileName.slice(0, extensionIndex)
      : fileName;

  const cleanedBaseName = baseName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${cleanedBaseName || "image"}${extension}`;
}

export async function POST(request: NextRequest) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error:
            "BLOB_READ_WRITE_TOKEN is missing from the deployed environment.",
        },
        { status: 500 }
      );
    }

    if (
      token.startsWith('"') ||
      token.endsWith('"') ||
      token.startsWith("'") ||
      token.endsWith("'")
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "BLOB_READ_WRITE_TOKEN contains quotation marks. Remove the quotation marks in Vercel.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();

    const fileValue =
      formData.get("file") ||
      formData.get("files") ||
      formData.get("image");

    if (!(fileValue instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid image file was received.",
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
          error: "The image must be smaller than 10 MB.",
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

    const pathname =
      `products/${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;

    const blob = await put(pathname, fileValue, {
      access: "public",
      token,
      addRandomSuffix: false,
      contentType: fileValue.type,
    });

    return NextResponse.json(
      {
        success: true,
        url: blob.url,
        image_url: blob.url,
        pathname: blob.pathname,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Vercel Blob upload failure:", error);

    const message =
      error instanceof Error
        ? error.message
        : "The image upload failed.";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}