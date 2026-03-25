"use client";

import { useState } from "react";

const options = [
  "New restaurant spot opens",
  "New bar spot opens",
  "Live music this Friday",
  "Events in Lafayette this weekend",
  "New crawfish spot",
  "Price drop on crawfish",
  "A place posts a special",
];

export default function AlertsPage() {
  const [email, setEmail] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  function toggle(value: string) {
    setSelected((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  async function submit() {
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, types: selected }),
    });
    const data = await res.json();
    setMessage(res.ok ? data.message : data.error);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <section className="rounded-2xl border border-[var(--spanish-moss)]/25 bg-white p-6 reveal is-visible">
        <p className="text-xs tracking-[0.2em] text-[var(--moss)]">ALERT BUILDER</p>
        <h1 className="mt-2 text-4xl text-[var(--cajun-red)]">Alert Me When...</h1>
        <p className="mt-2 text-[var(--warm-gray)]">Tell us what you care about and we’ll keep watch across Acadiana.</p>

        <input className="mt-5 w-full rounded-xl border p-3" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className="mt-4 grid gap-3">
          {options.map((option) => (
            <label key={option} className="flex items-center gap-2 rounded-lg border border-[var(--spanish-moss)]/25 p-3">
              <input type="checkbox" checked={selected.includes(option)} onChange={() => toggle(option)} />
              {option}
            </label>
          ))}
        </div>

        <button onClick={submit} className="mt-4 rounded-xl bg-[var(--cajun-red)] px-4 py-2 font-semibold text-white">Save My Alerts</button>
        {message ? <p className="mt-3 text-sm">{message}</p> : null}
      </section>
    </main>
  );
}
