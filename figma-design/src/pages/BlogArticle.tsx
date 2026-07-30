import { useParams, Link } from "react-router";
import { ArrowLeft, Clock, Calendar, Facebook, Twitter, Linkedin, ArrowRight } from "lucide-react";

export default function BlogArticle() {
  const { slug } = useParams();

  const articles: Record<string, { title: string; category: string; readTime: string; date: string; img: string; author: string; role: string; content: { type: string; text: string }[] }> = {
    "uk-visa-guide-2025": {
      title: "UK Visa Application Guide 2025: Everything UAE Residents Need to Know",
      category: "Visa Tips", readTime: "8 min", date: "10 Jan 2025",
      img: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&h=500&fit=crop&auto=format",
      author: "Sara Ahmed", role: "Head of Visa Services",
      content: [
        { type: "lead", text: "The UK Standard Visitor Visa remains one of the most applied-for visas from the UAE, and also one of the most scrutinised. In 2024, our team processed over 3,500 UK visa applications with a 94% approval rate. Here's exactly what we know works." },
        { type: "h2",  text: "What Documents Do You Need?" },
        { type: "p",   text: "The UK Visas and Immigration (UKVI) requires a specific set of documents from UAE residents. Core requirements include a valid passport, 3–6 months of personal bank statements, employment letter, hotel bookings, return tickets, and optionally travel insurance." },
        { type: "list",text: "Valid passport with at least 6 months validity|3–6 months of personal bank statements showing regular income|Employment letter or business registration documents|Hotel or accommodation bookings for your entire stay|Return or onward flight tickets|Previous UK or Schengen travel history if applicable" },
        { type: "h2",  text: "The Bank Statement Rules" },
        { type: "p",   text: "This is where most applications fail. Our experience shows that a balance equivalent to approximately £1,000–1,500 per week of stay is generally sufficient for a single applicant. Statements must show consistent regular income, no large unexplained inflows in the weeks before application, and a stable pattern of spending and saving." },
        { type: "h2",  text: "Processing Timeline" },
        { type: "p",   text: "Standard UK visa processing is currently running at 12–18 business days from the biometric appointment date. Priority service (additional cost) typically delivers a decision within 5 business days. Super Priority is available for next-working-day decisions subject to appointment availability." },
        { type: "h2",  text: "Common Rejection Reasons" },
        { type: "list",text: "Insufficient financial evidence or unexplained large deposits|Failure to demonstrate strong ties to home country|Incomplete or inconsistent application form|Previous visa violations or overstays" },
      ],
    },
  };

  const article = (slug && articles[slug]) ? articles[slug] : {
    title: "Hajj 2025 Preparation: Your Month-by-Month Checklist",
    category: "Hajj & Umrah", readTime: "12 min", date: "05 Jan 2025",
    img: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=500&fit=crop&auto=format",
    author: "Khalid Al-Mansouri", role: "CEO & Hajj Director",
    content: [
      { type: "lead", text: "Preparing for Hajj requires months of spiritual, physical, and logistical preparation. Our team has guided over 2,000 pilgrims through this sacred journey. Here is the definitive guide." },
      { type: "h2",  text: "6 Months Before: Registration & Booking" },
      { type: "p",   text: "Hajj 2025 quotas are strictly controlled by Saudi authorities. UAE residents must register through an approved travel agent. TravelOS is a licensed Hajj operator. Book early — packages sell out months in advance." },
      { type: "h2",  text: "3 Months Before: Documentation" },
      { type: "list",text: "Valid passport (minimum 6 months validity)|Meningitis ACWY vaccination certificate|Mahram documentation for female pilgrims|Saudi Hajj visa application via our office|Travel insurance with medical evacuation cover" },
      { type: "h2",  text: "1 Month Before: Physical Preparation" },
      { type: "p",   text: "Hajj involves significant walking — often 10–15km per day. Begin a walking programme at least 6–8 weeks before departure. Consult your physician, especially if you have chronic health conditions. Our packages include access to on-trip medical staff." },
    ],
  };

  return (
    <div className="bg-background">
      <div className="bg-card border-b border-border py-3">
        <div className="max-w-[1440px] mx-auto px-8">
          <Link to="/blog" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
            <ArrowLeft size={14} /> Back to Blog
          </Link>
        </div>
      </div>

      <div className="relative h-80 overflow-hidden">
        <img src={article.img} alt={article.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="max-w-[1440px] mx-auto px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-10">
          <article className="lg:col-span-3">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#DBEAFE] text-[#1E40AF]">{article.category}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={11} /> {article.readTime} read</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar size={11} /> {article.date}</span>
            </div>
            <h1 className="text-foreground font-bold mb-6 leading-tight text-2xl">{article.title}</h1>
            <div className="flex items-center gap-3 mb-8 pb-8 border-b border-border">
              <div className="size-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">{article.author[0]}</div>
              <div>
                <p className="text-sm font-semibold text-foreground">{article.author}</p>
                <p className="text-xs text-muted-foreground">{article.role} · Shanghai Travels</p>
              </div>
              <div className="ml-auto flex gap-2">
                {[Facebook, Twitter, Linkedin].map((Icon, i) => (
                  <button key={i} className="size-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"><Icon size={13} /></button>
                ))}
              </div>
            </div>
            <div className="space-y-5">
              {article.content.map((block, i) => {
                if (block.type === "lead") return <p key={i} className="text-base text-foreground font-medium leading-relaxed border-l-4 border-accent pl-4">{block.text}</p>;
                if (block.type === "h2")  return <h2 key={i} className="text-foreground font-bold text-xl mt-8">{block.text}</h2>;
                if (block.type === "p")   return <p key={i} className="text-sm text-muted-foreground leading-relaxed">{block.text}</p>;
                if (block.type === "list") return (
                  <ul key={i} className="space-y-2">
                    {block.text.split("|").map((item, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <div className="size-1.5 rounded-full bg-accent mt-2 flex-shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                );
                return null;
              })}
            </div>
            <div className="mt-10 bg-primary rounded-2xl p-8">
              <h3 className="text-white font-bold text-lg mb-2">Ready to Apply?</h3>
              <p className="text-white/60 text-sm mb-5">Our specialists have a 98.7% approval rate. Let us handle your application.</p>
              <Link to="/inquiry" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-bold text-sm hover:bg-orange-500 transition-colors">
                Start Application <ArrowRight size={14} />
              </Link>
            </div>
          </article>

          <aside className="space-y-5">
            <div className="bg-card rounded-xl border border-border p-5">
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">Quick Help</p>
              <p className="text-sm text-muted-foreground mb-4">Have questions? Our experts respond within 2 hours.</p>
              <Link to="/inquiry" className="block w-full text-center py-2.5 rounded-lg bg-accent text-white font-semibold text-sm hover:bg-orange-600 transition-colors">Send Inquiry</Link>
            </div>
            <div className="bg-card rounded-xl border border-border p-5">
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">Related Articles</p>
              <div className="space-y-2">
                {["Schengen Visa Tips 2025", "US Visa for UAE Residents", "Australia ETA Guide"].map((t, i) => (
                  <Link key={i} to="/blog" className="block text-sm text-foreground hover:text-accent transition-colors py-2 border-b border-border last:border-0">{t} →</Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
