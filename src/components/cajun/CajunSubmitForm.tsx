"use client";

import { FormEvent, useState } from "react";
import { cajunCategories } from "@/lib/cajun-connection";

type FormMode = "business" | "fluencer";

export function CajunSubmitForm() {
  const [mode, setMode] = useState<FormMode>("business");
  const [status, setStatus] = useState<string>("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch("/api/cajun-connection/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: mode, ...payload }),
    });

    if (response.ok) {
      setStatus("Thanks! We'll review your submission within 48 hours.");
      event.currentTarget.reset();
    } else {
      setStatus("Could not submit right now. Please try again.");
    }
  }

  return (
    <div className="space-y-4 rounded-[12px] border border-[var(--spanish-moss)]/35 bg-white p-5">
      <div className="inline-flex rounded-[10px] border border-[var(--spanish-moss)]/30 p-1">
        <button type="button" onClick={() => setMode("business")} className={`min-h-11 rounded-[8px] px-4 text-sm ${mode === "business" ? "bg-[var(--cajun-red)] text-white" : "text-[var(--cast-iron)]"}`}>Submit a Business</button>
        <button type="button" onClick={() => setMode("fluencer")} className={`min-h-11 rounded-[8px] px-4 text-sm ${mode === "fluencer" ? "bg-[var(--cajun-red)] text-white" : "text-[var(--cast-iron)]"}`}>Apply as Cajun Fluencer</button>
      </div>

      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
        {mode === "business" ? (
          <>
            <input name="businessName" required placeholder="Business name" className="min-h-11 rounded-[10px] border border-[var(--spanish-moss)]/30 px-3" />
            <select name="category" required className="min-h-11 rounded-[10px] border border-[var(--spanish-moss)]/30 px-3">{cajunCategories.map((c) => <option key={c}>{c}</option>)}</select>
            <textarea name="description" required placeholder="Description" className="min-h-24 rounded-[10px] border border-[var(--spanish-moss)]/30 px-3 py-2 md:col-span-2" />
            <input name="website" placeholder="Website URL" className="min-h-11 rounded-[10px] border border-[var(--spanish-moss)]/30 px-3" />
            <input name="socialLinks" placeholder="Social links (comma-separated)" className="min-h-11 rounded-[10px] border border-[var(--spanish-moss)]/30 px-3" />
            <input name="location" required placeholder="City / Parish" className="min-h-11 rounded-[10px] border border-[var(--spanish-moss)]/30 px-3" />
            <input name="contactEmail" required type="email" placeholder="Contact email" className="min-h-11 rounded-[10px] border border-[var(--spanish-moss)]/30 px-3" />
            <input name="logoUpload" placeholder="Logo upload URL" className="min-h-11 rounded-[10px] border border-[var(--spanish-moss)]/30 px-3" />
            <input name="productPhotos" placeholder="Product photo URLs (comma-separated)" className="min-h-11 rounded-[10px] border border-[var(--spanish-moss)]/30 px-3 md:col-span-2" />
          </>
        ) : (
          <>
            <input name="name" required placeholder="Name" className="min-h-11 rounded-[10px] border border-[var(--spanish-moss)]/30 px-3" />
            <select name="primaryPlatform" required className="min-h-11 rounded-[10px] border border-[var(--spanish-moss)]/30 px-3">
              <option>Facebook</option><option>Instagram</option><option>TikTok</option><option>YouTube</option>
            </select>
            <input name="socialLinks" required placeholder="Social links" className="min-h-11 rounded-[10px] border border-[var(--spanish-moss)]/30 px-3 md:col-span-2" />
            <input name="followerCount" required type="number" placeholder="Follower count" className="min-h-11 rounded-[10px] border border-[var(--spanish-moss)]/30 px-3" />
            <input name="contentSpecialty" required placeholder="Content specialty" className="min-h-11 rounded-[10px] border border-[var(--spanish-moss)]/30 px-3" />
            <input name="sampleContentUrls" placeholder="Sample content URLs" className="min-h-11 rounded-[10px] border border-[var(--spanish-moss)]/30 px-3 md:col-span-2" />
            <textarea name="bio" required placeholder="Bio" className="min-h-24 rounded-[10px] border border-[var(--spanish-moss)]/30 px-3 py-2 md:col-span-2" />
          </>
        )}

        <button type="submit" className="min-h-11 rounded-[10px] bg-[var(--cajun-red)] px-4 text-sm font-semibold text-white md:col-span-2">Submit</button>
      </form>
      {status ? <p className="text-sm text-[var(--moss)]">{status}</p> : null}
    </div>
  );
}
