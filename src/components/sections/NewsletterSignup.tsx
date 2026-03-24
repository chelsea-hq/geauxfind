export function NewsletterSignup() {
  return (
    <form className="space-y-2">
      <label htmlFor="newsletter" className="text-sm font-medium">Acadiana Weekend Digest</label>
      <div className="flex gap-2"><input id="newsletter" type="email" placeholder="you@bayoumail.com" className="w-full rounded-full border border-[var(--warm-gray)]/30 bg-white px-4 py-2" /><button className="rounded-full bg-[var(--bayou-gold)] px-4 py-2 text-sm font-semibold">Sign Up</button></div>
    </form>
  );
}
