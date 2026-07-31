import { FormEvent, useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { Section, SectionHeader } from "./Section";
import { submitForm } from "./api";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      await submitForm({
        formType: "newsletter",
        email: email.trim(),
        name: name.trim() || undefined,
        source: "homepage-v4",
        message: "Newsletter signup from V4 homepage",
      });
      setStatus("success");
      setMessage("Thank you! You are subscribed to our travel updates.");
      setEmail("");
      setName("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again or call our hotline.");
    }
  }

  return (
    <Section id="newsletter" className="py-16 md:py-24 bg-primary">
      <div className="max-w-2xl mx-auto text-center">
        <SectionHeader
          eyebrow="Stay Updated"
          title="Subscribe to Travel Offers"
          subtitle="Get visa alerts, fare drops and pilgrimage package updates — straight to your inbox."
          centered
          className="[&_h2]:text-white [&_p]:text-white/65 mb-8"
        />

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
          <div className="relative flex-1">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              aria-label="Email address"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-0 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-bold text-sm hover:bg-orange-500 transition-colors disabled:opacity-60"
          >
            {status === "loading" ? "Subscribing…" : "Subscribe"}
            <ArrowRight size={16} />
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 text-sm ${status === "success" ? "text-green-300" : status === "error" ? "text-red-300" : "text-white/60"}`}
            role="status"
          >
            {message}
          </p>
        )}
      </div>
    </Section>
  );
}
