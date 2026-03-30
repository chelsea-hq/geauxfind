"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import seedPlaces from "../../../../scripts/seed-data.json";
import type { Place } from "@/types";
const places = seedPlaces as Place[];

export default function ClaimFlowPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const place = useMemo(() => places.find((item) => item.slug === slug), [slug]);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    claimantName: "",
    role: "",
    email: "",
    phone: "",
    logoFileName: "",
    coverFileName: "",
    description: place?.description ?? "",
    hours: (place?.hours || []).join("\n"),
    website: place?.website ?? "",
    instagram: "",
    facebook: "",
    tiktok: "",
    x: "",
    dealTitle: "",
    dealDetails: "",
    dealExpiresOn: "",
    plan: "free",
  });

  if (!place) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-8 text-center">
          <h1 className="font-serif text-3xl text-[var(--cajun-red)]">Business not found</h1>
          <p className="mt-2 text-sm text-[var(--warm-gray)]">Try searching your business again from the claim portal.</p>
          <Link href="/claim" className="mt-4 inline-flex min-h-11 items-center rounded-[10px] bg-[var(--cajun-red)] px-4 py-2 text-sm font-semibold text-white">Back to Claim Search</Link>
        </div>
      </main>
    );
  }

  async function submitClaim() {
    if (!place) return;

    setSubmitting(true);
    setError("");

    const response = await fetch("/api/claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: place.slug,
        businessName: place.name,
        verification: {
          claimantName: form.claimantName,
          role: form.role,
          email: form.email,
          phone: form.phone,
        },
        listingUpdates: {
          logoFileName: form.logoFileName,
          coverFileName: form.coverFileName,
          description: form.description,
          hours: form.hours,
          website: form.website,
          socialLinks: {
            instagram: form.instagram,
            facebook: form.facebook,
            tiktok: form.tiktok,
            x: form.x,
          },
        },
        firstDeal: {
          title: form.dealTitle,
          details: form.dealDetails,
          expiresOn: form.dealExpiresOn,
        },
        plan: "free",
      }),
    });

    const data = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setError(data?.error || "Unable to submit claim.");
      return;
    }

    router.push(`/claim/${place.slug}/confirmation`);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-6">
        <p className="text-xs tracking-[0.18em] text-[var(--moss)]">CLAIM LISTING</p>
        <h1 className="mt-2 font-serif text-3xl text-[var(--cajun-red)]">{place.name}</h1>
        <p className="mt-1 text-sm text-[var(--warm-gray)]">Step {step} of 3</p>

        {step === 1 ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <input placeholder="Your full name" className="min-h-11 rounded-[10px] border px-3" value={form.claimantName} onChange={(e) => setForm((s) => ({ ...s, claimantName: e.target.value }))} />
            <input placeholder="Your role" className="min-h-11 rounded-[10px] border px-3" value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))} />
            <input type="email" placeholder="you@business.com" className="min-h-11 rounded-[10px] border px-3" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
            <input placeholder="Phone" className="min-h-11 rounded-[10px] border px-3" value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-5 grid gap-3">
            <label className="text-sm text-[var(--warm-gray)]">Upload logo
              <input type="file" accept="image/*" className="mt-1 min-h-11 w-full rounded-[10px] border px-3 py-2" onChange={(e) => setForm((s) => ({ ...s, logoFileName: e.target.files?.[0]?.name || "" }))} />
            </label>
            <label className="text-sm text-[var(--warm-gray)]">Upload cover photo
              <input type="file" accept="image/*" className="mt-1 min-h-11 w-full rounded-[10px] border px-3 py-2" onChange={(e) => setForm((s) => ({ ...s, coverFileName: e.target.files?.[0]?.name || "" }))} />
            </label>
            <textarea placeholder="Business description" className="min-h-24 rounded-[10px] border px-3 py-2" value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
            <textarea placeholder="Hours (one per line)" className="min-h-24 rounded-[10px] border px-3 py-2" value={form.hours} onChange={(e) => setForm((s) => ({ ...s, hours: e.target.value }))} />
            <input placeholder="Website" className="min-h-11 rounded-[10px] border px-3" value={form.website} onChange={(e) => setForm((s) => ({ ...s, website: e.target.value }))} />
            <div className="grid gap-3 md:grid-cols-2">
              <input placeholder="Instagram URL" className="min-h-11 rounded-[10px] border px-3" value={form.instagram} onChange={(e) => setForm((s) => ({ ...s, instagram: e.target.value }))} />
              <input placeholder="Facebook URL" className="min-h-11 rounded-[10px] border px-3" value={form.facebook} onChange={(e) => setForm((s) => ({ ...s, facebook: e.target.value }))} />
              <input placeholder="TikTok URL" className="min-h-11 rounded-[10px] border px-3" value={form.tiktok} onChange={(e) => setForm((s) => ({ ...s, tiktok: e.target.value }))} />
              <input placeholder="X URL" className="min-h-11 rounded-[10px] border px-3" value={form.x} onChange={(e) => setForm((s) => ({ ...s, x: e.target.value }))} />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-5 grid gap-3">
            <input placeholder="Deal title (ex: 2-for-1 tacos Tuesday)" className="min-h-11 rounded-[10px] border px-3" value={form.dealTitle} onChange={(e) => setForm((s) => ({ ...s, dealTitle: e.target.value }))} />
            <textarea placeholder="Deal details (optional but encouraged)" className="min-h-24 rounded-[10px] border px-3 py-2" value={form.dealDetails} onChange={(e) => setForm((s) => ({ ...s, dealDetails: e.target.value }))} />
            <input type="date" className="min-h-11 rounded-[10px] border px-3" value={form.dealExpiresOn} onChange={(e) => setForm((s) => ({ ...s, dealExpiresOn: e.target.value }))} />
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-[var(--cajun-red)]">{error}</p> : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" onClick={() => setStep((s) => Math.max(1, s - 1))} className="min-h-11 rounded-[10px] border border-[var(--spanish-moss)]/40 px-4 py-2 text-sm" disabled={step === 1}>Back</button>
          {step < 3 ? (
            <button type="button" onClick={() => setStep((s) => Math.min(3, s + 1))} className="min-h-11 rounded-[10px] bg-[var(--cajun-red)] px-4 py-2 text-sm font-semibold text-white">Continue</button>
          ) : (
            <button type="button" onClick={submitClaim} disabled={submitting} className="min-h-11 rounded-[10px] bg-[var(--cajun-red)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{submitting ? "Submitting..." : "Submit Claim"}</button>
          )}
        </div>
      </div>
    </main>
  );
}
