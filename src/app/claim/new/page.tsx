"use client";

import Link from "next/link";
import { useState } from "react";

export default function NewBusinessSubmissionPage() {
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    name: "",
    category: "",
    cuisineType: "",
    city: "",
    address: "",
    phone: "",
    website: "",
    description: "",
    hours: "",
    photos: "",
  });

  async function submitForm() {
    setStatus("Submitting...");
    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        photos: form.photos.split("\n").map((line) => line.trim()).filter(Boolean),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setStatus(data?.error || "Unable to submit business.");
      return;
    }

    setSubmitted(true);
    setStatus("Submitted!");
  }

  if (submitted) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <section className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-8 text-center">
          <h1 className="font-serif text-3xl text-[var(--cajun-red)]">Thanks for submitting your business!</h1>
          <p className="mt-3 text-[var(--cast-iron)]">Our team will review it shortly and get it published.</p>
          <Link href="/claim" className="mt-6 inline-flex min-h-11 items-center rounded-[10px] bg-[var(--cajun-red)] px-4 py-2 text-sm font-semibold text-white">Return to Claim Portal</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <section className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-6">
        <p className="text-xs tracking-[0.18em] text-[var(--moss)]">ADD A NEW BUSINESS</p>
        <h1 className="mt-2 font-serif text-3xl text-[var(--cajun-red)]">Don&apos;t see your business? Add it to GeauxFind.</h1>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <input placeholder="Business name" className="min-h-11 rounded-[10px] border px-3" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
          <input placeholder="Category" className="min-h-11 rounded-[10px] border px-3" value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} />
          <input placeholder="Cuisine type" className="min-h-11 rounded-[10px] border px-3" value={form.cuisineType} onChange={(e) => setForm((s) => ({ ...s, cuisineType: e.target.value }))} />
          <input placeholder="City" className="min-h-11 rounded-[10px] border px-3" value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} />
          <input placeholder="Address" className="min-h-11 rounded-[10px] border px-3 md:col-span-2" value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} />
          <input placeholder="Phone" className="min-h-11 rounded-[10px] border px-3" value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} />
          <input placeholder="Website" className="min-h-11 rounded-[10px] border px-3" value={form.website} onChange={(e) => setForm((s) => ({ ...s, website: e.target.value }))} />
          <textarea placeholder="Description" className="min-h-24 rounded-[10px] border px-3 py-2 md:col-span-2" value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
          <textarea placeholder="Hours (one per line)" className="min-h-24 rounded-[10px] border px-3 py-2 md:col-span-2" value={form.hours} onChange={(e) => setForm((s) => ({ ...s, hours: e.target.value }))} />
          <textarea placeholder="Photo URLs (one per line)" className="min-h-24 rounded-[10px] border px-3 py-2 md:col-span-2" value={form.photos} onChange={(e) => setForm((s) => ({ ...s, photos: e.target.value }))} />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" onClick={submitForm} className="min-h-11 rounded-[10px] bg-[var(--cajun-red)] px-4 py-2 text-sm font-semibold text-white">Submit Business</button>
          <Link href="/claim" className="min-h-11 rounded-[10px] border border-[var(--spanish-moss)]/40 px-4 py-2 text-sm">Back to Claim</Link>
        </div>

        {status ? <p className="mt-3 text-sm text-[var(--warm-gray)]">{status}</p> : null}
      </section>
    </main>
  );
}
