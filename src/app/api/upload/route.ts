import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedImageTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

const allowedDocumentTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function sanitiseFileName(fileName: string) {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is missing.");

      return NextResponse.json(
        {
          success: false,
          error:
            "The online file store is not configured. Add BLOB_READ_WRITE_TOKEN in Vercel and redeploy.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const uploadedFile = formData.get("file");

    if (!(uploadedFile instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid file was received.",
        },
        { status: 400 }
      );
    }

    if (uploadedFile.size === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "The selected file is empty.",
        },
        { status: 400 }
      );
    }

    const maximumSize = 10 * 1024 * 1024;

    if (uploadedFile.size > maximumSize) {
      return NextResponse.json(
        {
          success: false,
          error: "The file must be smaller than 10 MB.",
        },
        { status: 400 }
      );
    }

    const isImage = allowedImageTypes.includes(uploadedFile.type);
    const isDocument = allowedDocumentTypes.includes(uploadedFile.type);

    if (!isImage && !isDocument) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only JPG, PNG, WEBP, GIF, PDF, DOC and DOCX files are allowed.",
        },
        { status: 400 }
      );
    }

    const folder = isImage ? "public/images" : "public/documents";
    const safeName = sanitiseFileName(uploadedFile.name);
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;

    const blob = await put(
      `${folder}/${uniqueName}`,
      uploadedFile,
      {
        access: "public",
        addRandomSuffix: false,
        contentType: uploadedFile.type,
      }
    );

    return NextResponse.json({
      success: true,

      // Keep all these fields for compatibility with different admin forms.
      url: blob.url,
      image_url: blob.url,
      file_url: blob.url,

      pathname: blob.pathname,
      contentType: blob.contentType,
      size: uploadedFile.size,
      originalName: uploadedFile.name,
    });
  } catch (error) {
    console.error("Vercel Blob upload error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "The file could not be uploaded.";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}