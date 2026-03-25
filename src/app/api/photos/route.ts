import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/community-data";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

type PhotoRecord = {
  id: string;
  slug: string;
  url: string;
  caption?: string;
  createdAt: string;
};

const FILE = "photo-submissions.json";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim();
  const photos = await readJsonFile<PhotoRecord[]>(FILE, []);
  const filtered = slug ? photos.filter((p) => p.slug === slug) : photos;
  return NextResponse.json(filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const slug = String(formData.get("slug") || "").trim();
    const caption = String(formData.get("caption") || "").trim();
    const file = formData.get("file");

    if (!slug || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing slug or file." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_FILE_SIZE || file.size < 512) {
      return NextResponse.json({ error: "Photo failed moderation checks." }, { status: 400 });
    }

    const ext = file.type.split("/")[1] || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads", slug);
    const absPath = path.join(dir, fileName);

    await fs.mkdir(dir, { recursive: true });
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(absPath, Buffer.from(arrayBuffer));

    const record: PhotoRecord = {
      id: crypto.randomUUID(),
      slug,
      url: `/uploads/${slug}/${fileName}`,
      ...(caption ? { caption } : {}),
      createdAt: new Date().toISOString(),
    };

    const photos = await readJsonFile<PhotoRecord[]>(FILE, []);
    photos.unshift(record);
    await writeJsonFile(FILE, photos);

    return NextResponse.json({ success: true, photo: record });
  } catch {
    return NextResponse.json({ error: "Failed to upload photo." }, { status: 500 });
  }
}
