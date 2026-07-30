import { useState } from "react";
import { Link } from "react-router";
import { Search, Clock, ChevronDown, ArrowRight } from "lucide-react";

const POSTS = [
  { slug: "uk-visa-guide-2025",       category: "Visa Tips",         title: "UK Visa Application Guide 2025: Everything UAE Residents Need to Know",       excerpt: "A complete walkthrough of the UK Standard Visitor Visa — documents, bank statement rules, and how to avoid the most common rejection reasons.",          readTime: "8 min",  date: "10 Jan 2025", img: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=500&h=300&fit=crop&auto=format" },
  { slug: "hajj-2025-preparation",    category: "Hajj & Umrah",      title: "How to Prepare for Hajj 2025: Your Month-by-Month Checklist",                  excerpt: "From registering your intention to packing your ihram — our Hajj coordinators share the definitive preparation guide for pilgrims from the UAE.",         readTime: "12 min", date: "05 Jan 2025", img: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500&h=300&fit=crop&auto=format" },
  { slug: "bali-travel-tips",         category: "Travel Tips",       title: "First-Time Bali: 15 Things Nobody Tells You Before You Go",                    excerpt: "From navigating Seminyak traffic to temple dress codes — our Bali specialists share insider tips that make the difference between good and great.",          readTime: "6 min",  date: "28 Dec 2024", img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=500&h=300&fit=crop&auto=format" },
  { slug: "corporate-travel-savings", category: "Corporate Travel",  title: "5 Ways to Cut Your Corporate Travel Budget Without Sacrificing Quality",       excerpt: "TravelOS clients save an average of 23% on corporate travel with these proven strategies — advance booking, preferred supplier rates, and smart approvals.", readTime: "5 min",  date: "20 Dec 2024", img: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=500&h=300&fit=crop&auto=format" },
  { slug: "schengen-visa-tips",       category: "Visa Tips",         title: "Schengen Visa: How We Achieve a 91% Approval Rate",                            excerpt: "The Schengen visa is one of the most scrutinised applications. Here's exactly what embassies look for — and what gets applications rejected.",             readTime: "9 min",  date: "15 Dec 2024", img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500&h=300&fit=crop&auto=format" },
  { slug: "maldives-guide",           category: "Destination Guide", title: "Maldives on a Budget: How to Experience Paradise for Less",                    excerpt: "You don't need an unlimited budget to visit the Maldives. With smart island choice, off-peak timing, and our B2B rates, AED 4,500 is achievable.",        readTime: "7 min",  date: "08 Dec 2024", img: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=500&h=300&fit=crop&auto=format" },
];

const FAQS = [
  { q: "How long does a UK visa take to process?", a: "Standard UK visitor visa processing takes approximately 15 business days from the date of biometric appointment. Priority service reduces this to 5 business days. Super Priority is available for next-working-day decisions subject to appointment availability." },
  { q: "What documents do I need for a Schengen visa?", a: "Core requirements: valid passport (6+ months), application form, 2 passport photos, travel insurance (min. €30,000), hotel confirmations, return flight tickets, 3 months bank statements, and proof of employment. Additional documents may apply." },
  { q: "Can I apply for a US visa through your office?", a: "Yes. We assist with the DS-160 form, biometric and interview appointments, and supporting documents. The final approval decision rests with the US Embassy. Our fee covers consultancy and document preparation only." },
  { q: "What is your visa refund policy if my visa is rejected?", a: "We offer a partial refund of our service fee if your application is refused, excluding the non-refundable government visa fee. We also provide a free reapplication consultation to strengthen your case for a second attempt." },
  { q: "Do you offer Hajj and Umrah packages year-round?", a: "Umrah packages are available year-round (except during Hajj season, Dhul Hijja 8–13). Hajj 2025 packages are now accepting registrations — spaces are limited by Saudi quota. We recommend booking 4–6 months in advance." },
  { q: "How do I pay for my booking?", a: "We accept bank transfers, credit/debit cards (Visa, Mastercard, AMEX), and cash at our Dubai office. A 20–50% deposit is required at booking with the balance due 30 days before departure. Online instalment options are available." },
  { q: "Is travel insurance mandatory?", a: "Travel insurance is mandatory for Schengen visa applications (min. €30,000 medical coverage). For all other destinations we strongly recommend it. We offer competitive travel insurance in partnership with leading UAE insurers." },
  { q: "Can you arrange group travel for corporate clients?", a: "Absolutely. Our corporate travel division handles groups of any size — from 5 to 500+ travellers. Services include group visa processing, charter flights, hotel blocks, ground transportation, and dedicated on-trip support." },
];

const CATEGORIES = ["All", "Visa Tips", "Hajj & Umrah", "Travel Tips", "Corporate Travel", "Destination Guide"];

export default function Blog() {
  const [view, setView] = useState<"blog" | "faq">("blog");
  const [category, setCategory] = useState("All");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filteredPosts = POSTS.filter(p =>
    (category === "All" || p.category === category) &&
    (p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <section className="bg-primary py-24">
        <div className="max-w-[1440px] mx-auto px-8 text-center mb-8">
          <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-3">Knowledge Hub</p>
          <h1 className="text-white text-4xl font-bold mb-3">Blog &amp; FAQ</h1>
          <p className="text-white/65 max-w-lg mx-auto mb-6">Visa guides, destination tips, and answers to your most common travel questions.</p>
          <div className="flex justify-center gap-1 mb-6">
            {(["blog", "faq"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${view === v ? "bg-white text-primary" : "bg-white/15 text-white/80 hover:bg-white/25"}`}>
                {v === "blog" ? "Travel Blog" : "FAQ"}
              </button>
            ))}
          </div>
          <div className="max-w-xl mx-auto relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 text-sm border border-border rounded-xl bg-white focus:outline-none placeholder:text-muted-foreground" placeholder={view === "blog" ? "Search articles…" : "Search FAQs…"} />
          </div>
        </div>
      </section>

      {view === "blog" ? (
        <section className="py-12 bg-background">
          <div className="max-w-[1440px] mx-auto px-8">
            <div className="flex flex-wrap gap-2 mb-8">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${category === c ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:border-primary/30"}`}>{c}</button>
              ))}
            </div>
            {filteredPosts[0] && (
              <Link to={`/blog/${filteredPosts[0].slug}`} className="group block mb-8">
                <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all">
                  <div className="grid md:grid-cols-2">
                    <div className="relative overflow-hidden h-64 md:h-auto">
                      <img src={filteredPosts[0].img} alt={filteredPosts[0].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-8 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#DBEAFE] text-[#1E40AF] rounded-full">{filteredPosts[0].category}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={11} /> {filteredPosts[0].readTime}</span>
                      </div>
                      <h2 className="text-foreground font-bold text-xl mb-3 group-hover:text-accent transition-colors">{filteredPosts[0].title}</h2>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-5">{filteredPosts[0].excerpt}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{filteredPosts[0].date}</span>
                        <span className="text-xs font-semibold text-accent flex items-center gap-1">Read more <ArrowRight size={12} /></span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPosts.slice(1).map(post => (
                <Link key={post.slug} to={`/blog/${post.slug}`} className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all">
                  <div className="relative h-44 overflow-hidden">
                    <img src={post.img} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#DBEAFE] text-[#1E40AF] rounded-full">{post.category}</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock size={10} /> {post.readTime}</span>
                    </div>
                    <h4 className="text-foreground font-bold mb-2 group-hover:text-accent transition-colors line-clamp-2">{post.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>
                    <p className="text-[10px] text-muted-foreground">{post.date}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="py-12 bg-background">
          <div className="max-w-3xl mx-auto px-8">
            <div className="space-y-3">
              {FAQS.filter(f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())).map((faq, i) => (
                <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
                  <button className="w-full flex items-start justify-between gap-4 p-5 text-left hover:bg-muted/30 transition-colors" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <p className="text-sm font-semibold text-foreground">{faq.q}</p>
                    <ChevronDown size={16} className={`text-muted-foreground flex-shrink-0 mt-0.5 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 border-t border-border">
                      <p className="text-sm text-muted-foreground leading-relaxed pt-4">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-10 bg-primary rounded-2xl p-8 text-center">
              <h3 className="text-white font-bold mb-2">Still have questions?</h3>
              <p className="text-white/60 text-sm mb-5">Our team is ready to help — call, email, or visit our Dubai office.</p>
              <div className="flex items-center justify-center gap-3">
                <Link to="/contact" className="px-5 py-2.5 rounded-lg bg-accent text-white font-bold text-sm hover:bg-orange-500 transition-colors">Contact Us</Link>
                <Link to="/inquiry" className="px-5 py-2.5 rounded-lg border border-white/20 text-white font-semibold text-sm hover:bg-white/10 transition-colors">Submit Inquiry</Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
