"use client";

import { FormEvent, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? "Something went wrong. Please try again.");
      }

      setStatus("success");
      setMessage("You’re in! Watch for The Weekly Geaux every Friday.");
      setEmail("");
      setName("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not subscribe right now.");
    }
  };

  return (
    <section className="rounded-3xl border border-[var(--bayou-gold)]/30 bg-[var(--cream-bg)] p-6 shadow-sm md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--cajun-red)]">The Weekly Geaux</p>
      <h3 className="mt-2 font-serif text-3xl text-[var(--cast-iron)]">Get the best of Acadiana in your inbox every Friday</h3>
      <p className="mt-2 text-sm text-[var(--warm-gray)]">Festivals, food finds, live music, and local gems — handpicked every week.</p>

      <form onSubmit={onSubmit} className="mt-5 grid gap-3 md:grid-cols-[1fr,1.2fr,auto]">
        <label className="sr-only" htmlFor="newsletter-name">
          First name
        </label>
        <input
          id="newsletter-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="First name (optional)"
          className="w-full rounded-full border border-[var(--warm-gray)]/30 bg-white px-4 py-3 text-sm outline-none ring-[var(--bayou-gold)]/40 transition focus:ring"
        />

        <label className="sr-only" htmlFor="newsletter-email">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          placeholder="you@bayoumail.com"
          className="w-full rounded-full border border-[var(--warm-gray)]/30 bg-white px-4 py-3 text-sm outline-none ring-[var(--bayou-gold)]/40 transition focus:ring"
        />

        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-full bg-[var(--cajun-red)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "loading" ? "Joining..." : "Join the List"}
        </button>
      </form>

      {message ? (
        <p className={`mt-3 text-sm ${status === "success" ? "text-[var(--bayou-green,#4a7c59)]" : "text-[var(--cajun-red)]"}`}>{message}</p>
      ) : null}
    </section>
  );
}
