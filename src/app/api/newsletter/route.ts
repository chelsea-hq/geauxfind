import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

type Subscriber = {
  email: string;
  name?: string;
  subscribedAt: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const dataDir = path.join(process.cwd(), "data");
const subscribersPath = path.join(dataDir, "newsletter-subscribers.json");

async function readSubscribers(): Promise<Subscriber[]> {
  try {
    const file = await fs.readFile(subscribersPath, "utf8");
    const parsed = JSON.parse(file);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeSubscribers(subscribers: Subscriber[]) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(subscribersPath, JSON.stringify(subscribers, null, 2), "utf8");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address." }, { status: 400 });
    }

    const subscribers = await readSubscribers();
    const exists = subscribers.some((subscriber) => subscriber.email.toLowerCase() === email);

    if (exists) {
      return NextResponse.json({ success: true, message: "You’re already on the list." });
    }

    subscribers.push({
      email,
      ...(name ? { name } : {}),
      subscribedAt: new Date().toISOString(),
    });

    await writeSubscribers(subscribers);

    return NextResponse.json({ success: true, message: "Subscribed successfully." });
  } catch {
    return NextResponse.json({ success: false, error: "Could not save your signup. Please try again." }, { status: 500 });
  }
}
