import { NextRequest, NextResponse } from "next/server";
import { BusinessProfile } from "@/types";
import { readJsonFile, writeJsonFile } from "@/lib/community-data";
import { getPlaceBySlug } from "@/lib/supabase-data";

const FILE = "business-profiles.json";

async function defaultProfile(slug: string): Promise<BusinessProfile> {
  const place = await getPlaceBySlug(slug);
  return {
    slug,
    description: place?.description || "",
    phone: place?.phone || "",
    website: place?.website || "",
    hours: place?.hours || [],
    specials: [],
    updatedAt: new Date().toISOString(),
  };
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profiles = await readJsonFile<BusinessProfile[]>(FILE, []);
  const profile = profiles.find((p) => p.slug === slug) || (await defaultProfile(slug));
  return NextResponse.json(profile);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const body = await request.json();
    const profiles = await readJsonFile<BusinessProfile[]>(FILE, []);
    const idx = profiles.findIndex((p) => p.slug === slug);
    const existing = idx >= 0 ? profiles[idx] : await defaultProfile(slug);

    const next: BusinessProfile = {
      ...existing,
      description: String(body?.description ?? existing.description),
      phone: String(body?.phone ?? existing.phone),
      website: String(body?.website ?? existing.website),
      hours: Array.isArray(body?.hours) ? body.hours.map(String) : existing.hours,
      specials: Array.isArray(body?.specials) ? body.specials : existing.specials,
      updatedAt: new Date().toISOString(),
    };

    if (idx >= 0) profiles[idx] = next;
    else profiles.push(next);
    await writeJsonFile(FILE, profiles);

    return NextResponse.json({ success: true, profile: next });
  } catch {
    return NextResponse.json({ error: "Unable to update business profile." }, { status: 500 });
  }
}
