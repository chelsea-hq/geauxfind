import { CajunSubmitForm } from "@/components/cajun/CajunSubmitForm";

export default function CajunConnectionSubmitPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-5 px-4 pb-16 pt-10">
      <h1 className="text-4xl text-[var(--cajun-red)]">Join Cajun Connection</h1>
      <p className="text-[var(--warm-gray)]">Submit your business or apply as a featured Cajun fluencer.</p>
      <CajunSubmitForm />
    </main>
  );
}
