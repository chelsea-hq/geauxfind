"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import { useLocation } from "@/hooks/useLocation";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const suggestions = [
  "Best boudin near Lafayette?",
  "Kid-friendly festivals this month",
  "Where to hear live accordion tonight?",
  "Date night spots in Breaux Bridge",
  "Top-rated crawfish in Acadiana",
];

export default function AskPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hey y'all 👋 I'm Geaux the Gator. Ask me anything about Acadiana food, events, places, and local culture, and I’ll point you to the good stuff.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { lat, lng, city, loading: locating, requestLocation } = useLocation();

  const canSend = useMemo(() => !!input.trim() && !isLoading, [input, isLoading]);

  const sendQuestion = async (rawQuestion: string) => {
    const question = rawQuestion.trim();
    if (!question || isLoading) return;

    const baseMessages = [...messages, { role: "user" as const, content: question }];
    setMessages([...baseMessages, { role: "assistant", content: "" }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          history: messages.filter((m) => m.content.trim().length > 0),
          location: { lat, lng, city },
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("bad_response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          const dataLine = event
            .split("\n")
            .map((line) => line.trim())
            .find((line) => line.startsWith("data:"));

          if (!dataLine) continue;

          const dataPayload = dataLine.replace(/^data:\s*/, "");
          if (!dataPayload) continue;

          try {
            const parsed = JSON.parse(dataPayload) as {
              token?: string;
              done?: boolean;
              error?: string;
            };

            if (parsed.error) {
              throw new Error(parsed.error);
            }

            if (parsed.token) {
              assistantText += parsed.token;
              setMessages([...baseMessages, { role: "assistant", content: assistantText }]);
            }
          } catch {
            // Ignore malformed stream event chunks.
          }
        }
      }

      if (!assistantText.trim()) {
        setMessages([
          ...baseMessages,
          {
            role: "assistant",
            content: "I’m having trouble thinking right now. Give me one sec and try again.",
          },
        ]);
      }
    } catch {
      setMessages([
        ...baseMessages,
        {
          role: "assistant",
          content: "I’m having trouble thinking right now. Give me one sec and try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await sendQuestion(input);
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-4xl flex-col px-4 py-6 md:py-10">
      <h1 className="font-serif text-3xl text-[var(--cajun-red)] md:text-5xl">Ask Acadiana</h1>
      <p className="mt-2 text-sm text-[var(--warm-gray)] md:text-base">
        Your local AI guide for food, music, festivals, and hidden gems across South Louisiana.
      </p>
      <div className="mt-3 flex items-center gap-3 text-xs text-[var(--warm-gray)] md:text-sm">
        <span>Current area: {city}</span>
        <button
          type="button"
          onClick={requestLocation}
          disabled={locating}
          className="rounded-full border border-[var(--warm-gray)]/30 bg-white px-3 py-1 transition hover:bg-[var(--cream-bg)] disabled:opacity-50"
        >
          {locating ? "Locating..." : "Use my exact location"}
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={isLoading}
            onClick={() => sendQuestion(suggestion)}
            className="rounded-full border border-[var(--bayou-gold)]/50 bg-[var(--bayou-gold)]/20 px-3 py-1.5 text-sm text-[var(--cast-iron)] transition hover:-translate-y-0.5 hover:bg-[var(--bayou-gold)]/35 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <section className="mt-4 flex-1 overflow-hidden rounded-2xl border border-[var(--warm-gray)]/20 bg-white shadow-sm">
        <div className="h-[52vh] space-y-3 overflow-y-auto p-4 md:h-[58vh] md:p-5">
          {messages.map((message, idx) => (
            <div key={`${message.role}-${idx}`} className={`flex items-start gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" ? (
                <Image
                  src={isLoading && idx === messages.length - 1 && !message.content ? "/mascot/gator-think.svg" : "/mascot/gator-chat.svg"}
                  alt="Geaux the Gator"
                  width={34}
                  height={34}
                  className="mt-1 h-8 w-8 shrink-0"
                />
              ) : null}
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm md:max-w-[80%] md:text-base ${
                  message.role === "user"
                    ? "bg-[var(--cajun-red)] text-white"
                    : "bg-[var(--cream-bg)] text-[var(--cast-iron)] border border-[var(--bayou-gold)]/30"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{message.content || (isLoading && idx === messages.length - 1 ? "Geaux is thinking..." : "")}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={onSubmit} className="border-t border-[var(--warm-gray)]/20 bg-[var(--cream-bg)]/70 p-3 md:p-4">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about Acadiana..."
              className="w-full rounded-full border border-[var(--warm-gray)]/30 bg-white px-4 py-3 text-sm outline-none ring-[var(--bayou-gold)] transition focus:ring-2 md:text-base"
            />
            <button
              type="submit"
              disabled={!canSend}
              className="rounded-full bg-[var(--cajun-red)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
