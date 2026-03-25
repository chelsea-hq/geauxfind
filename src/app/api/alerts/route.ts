import { NextResponse } from "next/server";
import { AlertSubscription } from "@/types";
import { readJsonFile, writeJsonFile } from "@/lib/community-data";

const FILE = "alert-subscriptions.json";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const types = Array.isArray(body?.types) ? body.types.map(String).filter(Boolean) : [];

    if (!EMAIL_REGEX.test(email) || types.length === 0) {
      return NextResponse.json({ error: "Valid email and at least one alert type are required." }, { status: 400 });
    }

    const subscriptions = await readJsonFile<AlertSubscription[]>(FILE, []);
    const next: AlertSubscription = {
      id: crypto.randomUUID(),
      email,
      types,
      createdAt: new Date().toISOString(),
    };

    subscriptions.unshift(next);
    await writeJsonFile(FILE, subscriptions);

    return NextResponse.json({ success: true, message: "You'll get an email when we spot something!" });
  } catch {
    return NextResponse.json({ error: "Unable to save alert subscription." }, { status: 500 });
  }
}
