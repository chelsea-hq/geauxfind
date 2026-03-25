import { JsonLd } from "@/components/JsonLd";

type FaqItem = { question: string; answer: string };

export function FaqSection({ title = "Frequently Asked Questions", items }: { title?: string; items: FaqItem[] }) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <section className="mt-10 rounded-2xl border border-[var(--spanish-moss)]/25 bg-white p-5">
      <JsonLd data={faqSchema} />
      <h2 className="text-2xl text-[var(--cajun-red)]">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <details key={item.question} className="rounded-xl border border-[var(--warm-gray)]/20 bg-[var(--cream-bg)] p-4">
            <summary className="cursor-pointer font-semibold">{item.question}</summary>
            <p className="mt-2 text-sm text-[var(--warm-gray)]">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
