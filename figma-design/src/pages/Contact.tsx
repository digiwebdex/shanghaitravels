import { useState } from "react";
import { Link } from "react-router";
import {
  MapPin, Phone, Mail, Clock, MessageSquare, Check,
  Facebook, Twitter, Instagram, Linkedin, Youtube,
  ArrowRight, ChevronDown,
} from "lucide-react";
import {
  EMAIL, HOTLINE, OFFICES, OPENING_HOURS, PHONES,
  mapHref, telHref, waHref,
} from "../company";
import { fallbackPhoto } from "../home/v4/photos";

const LOCATIONS = OFFICES.map((office, i) => ({
  ...office,
  phone: PHONES[i] ?? HOTLINE,
  // Only one verified Dhaka frame in the photo library, so the second card
  // takes a neutral travel image rather than repeating it side by side.
  photo: fallbackPhoto(
    i === 0 ? { places: ["bangladesh"], width: 600 } : { seed: office.label, width: 600 },
  ),
}));

/**
 * One shared inbox rather than per-department addresses. Routing is handled by
 * the enquiry form's department field.
 */
const DEPARTMENTS = [
  "Visa Enquiries",
  "Air Ticketing",
  "Tour Packages",
  "Hajj & Umrah",
  "Corporate Travel",
  "Finance / Payments",
];

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", subject: "", department: "", message: "",
  });
  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="bg-primary py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1600&h=400&fit=crop&auto=format"
            alt="Contact us"
            className="w-full h-full object-cover opacity-10"
          />
        </div>
        <div className="relative max-w-[1440px] mx-auto px-8 text-center">
          <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-3">Get in Touch</p>
          <h1 className="text-white text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-white/65 max-w-lg mx-auto mb-8">
            Talk to our travel specialists by phone, email or WhatsApp, or visit either of our Dhaka offices.
          </p>
          {/* Quick contact strip */}
          <div className="inline-flex flex-wrap justify-center gap-4">
            {PHONES.map(phone => (
              <a key={phone} href={telHref(phone)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-colors">
                <Phone size={14} className="text-accent" /> {phone}
              </a>
            ))}
            <a href={`mailto:${EMAIL}`} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-colors">
              <Mail size={14} className="text-accent" /> {EMAIL}
            </a>
            <a href={waHref(HOTLINE)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-colors">
              <MessageSquare size={14} className="text-accent" /> WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Main grid */}
      <section className="py-14">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="grid lg:grid-cols-3 gap-10">

            {/* Contact form */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-2xl border border-border p-8">
                <h2 className="text-foreground font-bold text-xl mb-1">Send Us a Message</h2>
                <p className="text-sm text-muted-foreground mb-6">We respond within 2 hours during business hours.</p>

                {sent ? (
                  <div className="text-center py-12">
                    <div className="size-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <Check size={28} className="text-green-600" />
                    </div>
                    <h3 className="text-foreground font-bold text-lg mb-2">Message Sent!</h3>
                    <p className="text-muted-foreground text-sm mb-6">
                      Thank you for reaching out. We'll get back to you within 2 hours.
                    </p>
                    <button
                      onClick={() => { setSent(false); setForm({ name: "", email: "", phone: "", subject: "", department: "", message: "" }); }}
                      className="px-5 py-2.5 rounded-lg border border-border text-foreground text-sm font-semibold hover:bg-muted transition-colors"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1.5">Full Name *</label>
                        <input
                          value={form.name} onChange={e => update("name", e.target.value)}
                          className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-primary placeholder:text-muted-foreground"
                          placeholder="Rahim Ahmed"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1.5">Email Address *</label>
                        <input
                          type="email" value={form.email} onChange={e => update("email", e.target.value)}
                          className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-primary placeholder:text-muted-foreground"
                          placeholder="you@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1.5">Phone Number</label>
                        <input
                          type="tel" value={form.phone} onChange={e => update("phone", e.target.value)}
                          className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-primary placeholder:text-muted-foreground"
                          placeholder="+880 1XXX-XXXXXX"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1.5">Department</label>
                        <div className="relative">
                          <select
                            value={form.department} onChange={e => update("department", e.target.value)}
                            className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background appearance-none focus:outline-none focus:border-primary"
                          >
                            <option value="">Select department…</option>
                            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                          </select>
                          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">Subject *</label>
                      <input
                        value={form.subject} onChange={e => update("subject", e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-primary placeholder:text-muted-foreground"
                        placeholder="e.g. UK visa application · Bali tour pricing · Corporate travel account"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">Message *</label>
                      <textarea
                        value={form.message} onChange={e => update("message", e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-primary resize-none placeholder:text-muted-foreground"
                        rows={5}
                        placeholder="Tell us how we can help — include any relevant details such as travel dates, number of travellers, destination, or booking reference…"
                      />
                    </div>
                    <div className="flex items-start gap-3 pt-1">
                      <input type="checkbox" id="consent" className="mt-0.5 rounded" />
                      <label htmlFor="consent" className="text-xs text-muted-foreground cursor-pointer">
                        I agree to the <Link to="/blog" className="text-accent underline">Privacy Policy</Link> and consent to Shanghai Travels contacting me regarding my enquiry.
                      </label>
                    </div>
                    <button
                      onClick={() => setSent(true)}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-bold text-sm hover:bg-orange-600 transition-colors"
                    >
                      Send Message <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar info */}
            <div className="space-y-5">
              {/* Hours */}
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock size={15} className="text-primary" />
                  </div>
                  <h4 className="text-foreground font-bold">Working Hours</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saturday – Sunday</span>
                    <span className="font-medium text-foreground">9:00 AM – 6:00 PM</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-xs text-muted-foreground">Emergency visa line available 24/7</p>
                  </div>
                </div>
              </div>

              {/* Department directory */}
              <div className="bg-card rounded-xl border border-border p-5">
                <h4 className="text-foreground font-bold mb-4">What We Handle</h4>
                <div className="space-y-3">
                  {DEPARTMENTS.map(label => (
                    <div key={label} className="py-2 border-b border-border last:border-0">
                      <p className="text-xs font-semibold text-foreground">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-border space-y-1.5">
                  {PHONES.map(phone => (
                    <a key={phone} href={telHref(phone)} className="text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1.5">
                      <Phone size={10} /> {phone}
                    </a>
                  ))}
                  <a href={`mailto:${EMAIL}`} className="text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1.5 break-all">
                    <Mail size={10} /> {EMAIL}
                  </a>
                </div>
              </div>

              {/* Social */}
              <div className="bg-primary rounded-xl p-5">
                <h4 className="text-white font-bold mb-3">Follow Us</h4>
                <div className="flex gap-2 mb-3">
                  {[Facebook, Twitter, Instagram, Linkedin, Youtube].map((Icon, i) => (
                    <a key={i} href="#" className="size-9 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white transition-all">
                      <Icon size={15} />
                    </a>
                  ))}
                </div>
                <p className="text-xs text-white/50">Stay updated on visa news, travel deals, and destination guides.</p>
              </div>

              {/* Apply Now CTA */}
              <div className="bg-accent rounded-xl p-5 text-center">
                <p className="text-white font-bold mb-1">Ready to Book?</p>
                <p className="text-white/80 text-xs mb-4">Skip the form — apply directly and get a specialist response in under 2 hours.</p>
                <Link to="/inquiry" className="block w-full py-2.5 rounded-lg bg-white text-accent font-bold text-sm hover:bg-orange-50 transition-colors">
                  Apply Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Office locations */}
      <section className="py-14 bg-muted/40 border-t border-border">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-2">Our Locations</p>
            <h2 className="text-foreground text-2xl font-bold">Visit Us in Dhaka</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {LOCATIONS.map(office => (
              <div key={office.label} className="bg-card rounded-2xl border border-border overflow-hidden group">
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={office.photo}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-4">
                    <p className="text-white font-bold text-lg">{office.label}</p>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <a
                    href={mapHref(office)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
                  >
                    <MapPin size={13} className="text-accent flex-shrink-0 mt-0.5" />
                    <span>{office.street}, {office.area}</span>
                  </a>
                  <a href={telHref(office.phone)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors">
                    <Phone size={13} className="text-accent" /> {office.phone}
                  </a>
                  <a href={`mailto:${EMAIL}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors break-all">
                    <Mail size={13} className="text-accent" /> {EMAIL}
                  </a>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground pt-1 border-t border-border">
                    <Clock size={11} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                    {OPENING_HOURS}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map placeholder */}
      <section className="h-72 bg-muted border-t border-border relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1600&h=400&fit=crop&auto=format"
          alt="Map"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-card rounded-2xl border border-border shadow-xl px-8 py-5 text-center">
            <div className="size-10 rounded-full bg-accent flex items-center justify-center mx-auto mb-2">
              <MapPin size={18} className="text-white" />
            </div>
            <p className="font-bold text-foreground">{OFFICES[0].label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{OFFICES[0].street}, {OFFICES[0].area}</p>
            <a
              href={mapHref(OFFICES[0])}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-accent hover:underline"
            >
              Open in Google Maps <ArrowRight size={11} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
