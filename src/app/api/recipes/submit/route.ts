import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const dataFile = path.join(process.cwd(), "data", "recipe-submissions.json");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await fs.mkdir(path.dirname(dataFile), { recursive: true });

    let current: unknown[] = [];
    try {
      const raw = await fs.readFile(dataFile, "utf8");
      current = JSON.parse(raw);
      if (!Array.isArray(current)) current = [];
    } catch {
      current = [];
    }

    current.push({ ...body, submittedAt: new Date().toISOString() });
    await fs.writeFile(dataFile, `${JSON.stringify(current, null, 2)}\n`, "utf8");

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to submit recipe" }, { status: 500 });
  }
}
