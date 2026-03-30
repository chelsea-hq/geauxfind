import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

type Subscriber = {
  email: string;
  name?: string;
  source?: string;
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

async function writeSubscriberFallback(email: string, name?: string, source = "website") {
  const subscribers = await readSubscribers();
  const exists = subscribers.some((subscriber) => subscriber.email.toLowerCase() === email.toLowerCase());

  if (exists) {
    return { alreadySubscribed: true };
  }

  subscribers.push({
    email,
    ...(name ? { name } : {}),
    ...(source ? { source } : {}),
    subscribedAt: new Date().toISOString(),
  });

  await writeSubscribers(subscribers);
  return { alreadySubscribed: false };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const source = typeof body?.source === "string" && body.source.trim() ? body.source.trim() : "website";

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address." }, { status: 400 });
    }

    try {
      const supabase = createAdminClient();
      const supabaseUntyped = supabase as unknown as {
        from: (table: string) => {
          upsert: (
            values: { email: string; name: string | null; source: string; unsubscribed_at: null },
            options: { onConflict: string }
          ) => Promise<{ error: unknown }>;
        };
      };
      const { error } = await supabaseUntyped
        .from("newsletter_subscribers")
        .upsert(
          {
            email,
            name: name || null,
            source,
            unsubscribed_at: null,
          },
          { onConflict: "email" }
        );

      if (error) throw error;

      return NextResponse.json({ success: true, message: "Subscribed successfully." });
    } catch (supabaseError: unknown) {
      console.error("Newsletter Supabase write failed, using JSON fallback:", supabaseError);
      const fallback = await writeSubscriberFallback(email, name || undefined, source);

      if (fallback.alreadySubscribed) {
        return NextResponse.json({ success: true, message: "You’re already on the list." });
      }

      return NextResponse.json({ success: true, message: "Subscribed successfully." });
    }
  } catch (error) {
    console.error("Newsletter API error:", error);
    return NextResponse.json({ success: false, error: "Could not save your signup. Please try again." }, { status: 500 });
  }
}
