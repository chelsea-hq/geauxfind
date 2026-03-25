"use client";

import { FormEvent, useState } from "react";

export default function SubmitRecipePage() {
  const [status, setStatus] = useState<string>("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Submitting...");

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const payload = {
      ...data,
      ingredients: String(data.ingredients || "").split("\n").map((x) => x.trim()).filter(Boolean),
      steps: String(data.steps || "").split("\n").map((x) => x.trim()).filter(Boolean)
    };

    const res = await fetch("/api/recipes/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      setStatus("Could not submit right now. Please try again.");
      return;
    }

    form.reset();
    setStatus("Thanks! Your recipe will be reviewed and featured on GeauxFind.");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-4xl text-[var(--cajun-red)]">Submit a Recipe</h1>
      <p className="mt-2 text-[var(--warm-gray)]">Share your family favorite and keep Acadiana flavors alive.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-[var(--warm-gray)]/20 bg-white p-6">
        <input name="title" required placeholder="Recipe title" className="w-full rounded-xl border border-[var(--warm-gray)]/30 px-4 py-3" />

        <div className="grid gap-3 md:grid-cols-2">
          <select name="difficulty" required className="rounded-xl border border-[var(--warm-gray)]/30 px-4 py-3">
            <option value="">Difficulty</option>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
          <input name="servings" required placeholder="Servings" className="rounded-xl border border-[var(--warm-gray)]/30 px-4 py-3" />
          <input name="prepTime" required placeholder="Prep time" className="rounded-xl border border-[var(--warm-gray)]/30 px-4 py-3" />
          <input name="cookTime" required placeholder="Cook time" className="rounded-xl border border-[var(--warm-gray)]/30 px-4 py-3" />
        </div>

        <textarea name="ingredients" required rows={6} placeholder="Ingredients (one per line)" className="w-full rounded-xl border border-[var(--warm-gray)]/30 px-4 py-3" />
        <textarea name="steps" required rows={7} placeholder="Steps (one per line)" className="w-full rounded-xl border border-[var(--warm-gray)]/30 px-4 py-3" />
        <input name="inspiredBy" required placeholder="Inspired by (restaurant/family/etc)" className="w-full rounded-xl border border-[var(--warm-gray)]/30 px-4 py-3" />
        <input name="image" placeholder="Image URL (optional)" className="w-full rounded-xl border border-[var(--warm-gray)]/30 px-4 py-3" />

        <button type="submit" className="rounded-full bg-[var(--cajun-red)] px-6 py-2 font-semibold text-white">Submit Recipe</button>
        {status ? <p className="text-sm text-[var(--bayou-green)]">{status}</p> : null}
      </form>
    </main>
  );
}
