import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import type { WhatsNewItem } from "@/types";

export async function GET() {
  const filePath = path.join(process.cwd(), "data", "whats-new.json");

  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const items = JSON.parse(raw) as WhatsNewItem[];
    return NextResponse.json(items);
  } catch {
    return NextResponse.json([]);
  }
}
