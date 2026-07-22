import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function cleanFileName(fileName: string): string {
  const extensionIndex = fileName.lastIndexOf(".");
  const extension = extensionIndex >= 0 ? fileName.slice(extensionIndex).toLowerCase() : "";
  const baseName = extensionIndex >= 0 ? fileName.slice(0, extensionIndex) : fileName;

  const cleanedBaseName = baseName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${cleanedBaseName || "file"}${extension}`;
}

function getUploadedFiles(formData: FormData): File[] {
  const candidates = [
    ...formData.getAll("files"),
    ...formData.getAll("file"),
    ...formData.getAll("image"),
  ];

  return candidates.filter(
    (value): value is File => value instanceof File && value.size > 0,
  );
}

export async function POST(request: NextRequest) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "BLOB_READ_WRITE_TOKEN is missing from the deployed environment.",
        },
        { status: 500 },
      );
    }

    if (/^["']|["']$/.test(token)) {
      return NextResponse.json(
        {
          success: false,
          error: "BLOB_READ_WRITE_TOKEN contains quotation marks. Remove them in Vercel.",
        },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const files = getUploadedFiles(formData);

    if (!files.length) {
      return NextResponse.json(
        {
          success: false,
          error: "No supported file was uploaded. Use JPG, PNG, WEBP, GIF or PDF files below 10 MB.",
        },
        { status: 400 },
      );
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: `${file.name} is larger than 10 MB.` },
          { status: 400 },
        );
      }

      if (!ALLOWED_FILE_TYPES.has(file.type)) {
        return NextResponse.json(
          {
            success: false,
            error: `${file.name} is not supported. Use JPG, PNG, WEBP, GIF, PDF, DOC or DOCX.`,
          },
          { status: 400 },
        );
      }
    }

    const uploaded = await Promise.all(
      files.map(async (file) => {
        const safeFileName = cleanFileName(file.name);
        const folder = file.type.startsWith("image/") ? "online-images" : "online-files";
        const pathname = `${folder}/${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;

        return put(pathname, file, {
          access: "public",
          token,
          addRandomSuffix: false,
          contentType: file.type,
        });
      }),
    );

    const urls = uploaded.map((blob) => blob.url);

    return NextResponse.json(
      {
        success: true,
        urls,
        url: urls[0],
        image_url: urls[0],
        pathname: uploaded[0]?.pathname,
        files: uploaded.map((blob) => ({
          url: blob.url,
          pathname: blob.pathname,
        })),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Vercel Blob upload failure:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "The file upload failed.",
      },
      { status: 500 },
    );
  }
}
