import { useState } from "react";
import { Link } from "react-router";
import {
  MapPin, Phone, Mail, Clock, MessageSquare, Check,
  Facebook, Twitter, Instagram, Linkedin, Youtube,
  ArrowRight, ChevronDown,
} from "lucide-react";

const OFFICES = [
  {
    city: "Dubai HQ",
    address: "Dubai Media City, Al Sufouh 2, Building 3, Office 401",
    phone: "+971 4 123 4567",
    email: "dubai@shanghaitravels.com",
    hours: "Mon–Sat 8:00 AM – 8:00 PM · Sun 10:00 AM – 4:00 PM",
    mapImg: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&h=300&fit=crop&auto=format",
  },
  {
    city: "Abu Dhabi",
    address: "Khalifa Street, Al Markaziyah, Abu Dhabi, UAE",
    phone: "+971 2 987 6543",
    email: "abudhabi@shanghaitravels.com",
    hours: "Mon–Sat 9:00 AM – 6:00 PM",
    mapImg: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=300&fit=crop&auto=format",
  },
  {
    city: "Sharjah",
    address: "Al Majaz 3, Buhaira Corniche, Sharjah, UAE",
    phone: "+971 6 555 1234",
    email: "sharjah@shanghaitravels.com",
    hours: "Mon–Sat 9:00 AM – 7:00 PM",
    mapImg: "https://images.unsplash.com/photo-1548407260-da850faa41e3?w=600&h=300&fit=crop&auto=format",
  },
];

const DEPARTMENTS = [
  { label: "Visa Enquiries",      email: "visa@shanghaitravels.com",      phone: "+971 4 123 4501" },
  { label: "Air Ticketing",       email: "flights@shanghaitravels.com",   phone: "+971 4 123 4502" },
  { label: "Tour Packages",       email: "tours@shanghaitravels.com",     phone: "+971 4 123 4503" },
  { label: "Hajj & Umrah",        email: "hajj@shanghaitravels.com",      phone: "+971 4 123 4504" },
  { label: "Corporate Travel",    email: "corporate@shanghaitravels.com", phone: "+971 4 123 4505" },
  { label: "Finance / Payments",  email: "finance@shanghaitravels.com",   phone: "+971 4 123 4506" },
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
            We're here 7 days a week. Talk to our travel specialists by phone, email, WhatsApp, or visit one of our UAE offices.
          </p>
          {/* Quick contact strip */}
          <div className="inline-flex flex-wrap justify-center gap-4">
            <a href="tel:+97141234567" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-colors">
              <Phone size={14} className="text-accent" /> +971 4 123 4567
            </a>
            <a href="mailto:info@shanghaitravels.com" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-colors">
              <Mail size={14} className="text-accent" /> info@shanghaitravels.com
            </a>
            <a href="https://wa.me/97141234567" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-colors">
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
                          placeholder="Ahmed Al-Rashidi"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1.5">Email Address *</label>
                        <input
                          type="email" value={form.email} onChange={e => update("email", e.target.value)}
                          className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-primary placeholder:text-muted-foreground"
                          placeholder="ahmed@company.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1.5">Phone Number</label>
                        <input
                          type="tel" value={form.phone} onChange={e => update("phone", e.target.value)}
                          className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-primary placeholder:text-muted-foreground"
                          placeholder="+971 50 123 4567"
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
                            {DEPARTMENTS.map(d => <option key={d.label}>{d.label}</option>)}
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
                  {[
                    { day: "Monday – Friday",  hours: "8:00 AM – 8:00 PM" },
                    { day: "Saturday",         hours: "8:00 AM – 6:00 PM" },
                    { day: "Sunday",           hours: "10:00 AM – 4:00 PM" },
                    { day: "Public Holidays",  hours: "10:00 AM – 2:00 PM" },
                  ].map(r => (
                    <div key={r.day} className="flex justify-between">
                      <span className="text-muted-foreground">{r.day}</span>
                      <span className="font-medium text-foreground">{r.hours}</span>
                    </div>
                  ))}
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
                <h4 className="text-foreground font-bold mb-4">Direct Lines</h4>
                <div className="space-y-3">
                  {DEPARTMENTS.map(d => (
                    <div key={d.label} className="py-2.5 border-b border-border last:border-0">
                      <p className="text-xs font-semibold text-foreground mb-1">{d.label}</p>
                      <div className="flex flex-col gap-0.5">
                        <a href={`tel:${d.phone}`} className="text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1.5">
                          <Phone size={10} /> {d.phone}
                        </a>
                        <a href={`mailto:${d.email}`} className="text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1.5">
                          <Mail size={10} /> {d.email}
                        </a>
                      </div>
                    </div>
                  ))}
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
            <h2 className="text-foreground text-2xl font-bold">Visit Us in the UAE</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {OFFICES.map(office => (
              <div key={office.city} className="bg-card rounded-2xl border border-border overflow-hidden group">
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={office.mapImg}
                    alt={office.city}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-4">
                    <p className="text-white font-bold text-lg">{office.city}</p>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin size={13} className="text-accent flex-shrink-0 mt-0.5" />
                    {office.address}
                  </div>
                  <a href={`tel:${office.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors">
                    <Phone size={13} className="text-accent" /> {office.phone}
                  </a>
                  <a href={`mailto:${office.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors">
                    <Mail size={13} className="text-accent" /> {office.email}
                  </a>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground pt-1 border-t border-border">
                    <Clock size={11} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                    {office.hours}
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
            <p className="font-bold text-foreground">Dubai Media City HQ</p>
            <p className="text-xs text-muted-foreground mt-0.5">Al Sufouh 2, Building 3, Office 401</p>
            <a
              href="https://maps.google.com"
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
