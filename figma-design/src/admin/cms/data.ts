export type PageStatus  = "published" | "draft" | "archived";
export type PostStatus  = "published" | "draft" | "scheduled";
export type PopupType   = "modal" | "banner_top" | "banner_bottom" | "slide_in";
export type BlockZone   = "header" | "footer" | "home" | "about" | "sidebar" | "checkout";

export interface CmsPage {
  id: string; slug: string; title: string; template: string;
  status: PageStatus; author: string; updatedAt: string;
  metaTitle?: string; metaDescription?: string; views: number;
  content: string;
}

export interface MenuItem {
  id: string; menuId: string; label: string; url: string;
  target: "_self" | "_blank"; order: number; parentId?: string;
  icon?: string;
}

export interface CmsMenu {
  id: string; name: string; location: string; itemCount: number; updatedAt: string;
  items: MenuItem[];
}

export interface BlogPost {
  id: string; slug: string; title: string; excerpt: string;
  category: string; tags: string[]; author: string;
  status: PostStatus; publishedAt?: string; scheduledAt?: string;
  updatedAt: string; views: number; featuredImage?: string;
  content: string;
}

export interface GalleryImage {
  id: string; filename: string; alt: string; category: string;
  url: string; size: string; uploadedAt: string; usedIn: string[];
}

export interface Slide {
  id: string; sliderId: string; title: string; subtitle?: string;
  imageUrl: string; ctaText?: string; ctaUrl?: string;
  order: number; active: boolean;
}

export interface Slider {
  id: string; name: string; location: string; slideCount: number;
  autoplay: boolean; interval: number; active: boolean; updatedAt: string;
  slides: Slide[];
}

export interface Popup {
  id: string; name: string; type: PopupType; title: string; content: string;
  ctaText?: string; ctaUrl?: string; triggerDelay: number; triggerScroll?: number;
  showOnPages: string[]; active: boolean; startDate?: string; endDate?: string;
  impressions: number; clicks: number;
}

export interface ContentBlock {
  id: string; name: string; zone: BlockZone; description: string;
  content: string; active: boolean; updatedAt: string;
}

export interface SeoRecord {
  id: string; pageTitle: string; slug: string; metaTitle: string;
  metaDescription: string; ogTitle: string; ogDescription: string;
  ogImage?: string; canonical?: string; noIndex: boolean;
  sitemapPriority: "0.1" | "0.5" | "0.8" | "1.0";
}

// ── Pages ─────────────────────────────────────────────────────────────────────
export const CMS_PAGES: CmsPage[] = [
  { id:"p1", slug:"/",             title:"Home",              template:"Home",      status:"published", author:"Admin",         updatedAt:"10 Jan 2025", views:24180, metaTitle:"TravelPro — Your Trusted Travel Partner in UAE", metaDescription:"Book flights, hotels, visas and tours with TravelPro.", content:"<h1>Welcome to TravelPro</h1><p>Your trusted travel partner in the UAE. We offer comprehensive travel services including visa assistance, flight booking, hotel reservations, and tour packages.</p>" },
  { id:"p2", slug:"/about",        title:"About Us",          template:"Standard", status:"published", author:"Admin",         updatedAt:"08 Jan 2025", views:3421,  metaTitle:"About TravelPro | UAE Travel Agency", metaDescription:"Learn about TravelPro's history, team, and mission.", content:"<h2>Our Story</h2><p>Founded in 2005, TravelPro has grown to become one of the UAE's most trusted travel and visa services companies.</p>" },
  { id:"p3", slug:"/services",     title:"Services",          template:"Services", status:"published", author:"Admin",         updatedAt:"09 Jan 2025", views:8812,  metaTitle:"Travel Services UAE — Visa, Flights, Hotels", metaDescription:"Explore our range of travel and visa services.", content:"<h2>Our Services</h2><p>From visa processing to complete holiday packages — we do it all.</p>" },
  { id:"p4", slug:"/visa",         title:"Visa Services",     template:"Service",  status:"published", author:"James Whitfield",updatedAt:"11 Jan 2025", views:15234, content:"<h2>Visa Services</h2><p>We process visas for 180+ destinations worldwide.</p>" },
  { id:"p5", slug:"/contact",      title:"Contact Us",        template:"Contact",  status:"published", author:"Admin",         updatedAt:"05 Jan 2025", views:2104,  content:"<h2>Get in Touch</h2><p>Our team is available 24/7.</p>" },
  { id:"p6", slug:"/hajj-umrah",   title:"Hajj & Umrah",      template:"Service",  status:"published", author:"Admin",         updatedAt:"07 Jan 2025", views:6788,  content:"<h2>Hajj & Umrah Packages</h2><p>Fulfil your spiritual journey with our curated packages.</p>" },
  { id:"p7", slug:"/privacy",      title:"Privacy Policy",    template:"Legal",    status:"published", author:"Admin",         updatedAt:"01 Jan 2025", views:312,   content:"<h2>Privacy Policy</h2><p>This policy describes how TravelPro handles your personal data.</p>" },
  { id:"p8", slug:"/promotions",   title:"Promotions",        template:"Promo",    status:"draft",     author:"James Whitfield",updatedAt:"13 Jan 2025", views:0,     content:"<h2>Current Promotions</h2><p>Coming soon — amazing deals for 2025.</p>" },
];

// ── Menus ─────────────────────────────────────────────────────────────────────
export const CMS_MENUS: CmsMenu[] = [
  {
    id:"m1", name:"Main Navigation", location:"header", itemCount:7, updatedAt:"08 Jan 2025",
    items:[
      { id:"mi1",  menuId:"m1", label:"Home",         url:"/",          target:"_self", order:1 },
      { id:"mi2",  menuId:"m1", label:"Services",     url:"/services",  target:"_self", order:2 },
      { id:"mi3",  menuId:"m1", label:"Visa",         url:"/visa",      target:"_self", order:3, parentId:"mi2" },
      { id:"mi4",  menuId:"m1", label:"Flights",      url:"/flights",   target:"_self", order:4, parentId:"mi2" },
      { id:"mi5",  menuId:"m1", label:"Hotels",       url:"/hotels",    target:"_self", order:5, parentId:"mi2" },
      { id:"mi6",  menuId:"m1", label:"About",        url:"/about",     target:"_self", order:6 },
      { id:"mi7",  menuId:"m1", label:"Contact",      url:"/contact",   target:"_self", order:7 },
    ],
  },
  {
    id:"m2", name:"Footer Links", location:"footer", itemCount:5, updatedAt:"05 Jan 2025",
    items:[
      { id:"mi8",  menuId:"m2", label:"Privacy Policy", url:"/privacy",  target:"_self", order:1 },
      { id:"mi9",  menuId:"m2", label:"Terms of Use",   url:"/terms",    target:"_self", order:2 },
      { id:"mi10", menuId:"m2", label:"Careers",         url:"/careers",  target:"_self", order:3 },
      { id:"mi11", menuId:"m2", label:"Sitemap",         url:"/sitemap",  target:"_self", order:4 },
      { id:"mi12", menuId:"m2", label:"Blog",            url:"/blog",     target:"_self", order:5 },
    ],
  },
  {
    id:"m3", name:"Mobile Menu", location:"mobile", itemCount:4, updatedAt:"08 Jan 2025",
    items:[
      { id:"mi13", menuId:"m3", label:"Home",    url:"/",         target:"_self", order:1 },
      { id:"mi14", menuId:"m3", label:"Services",url:"/services", target:"_self", order:2 },
      { id:"mi15", menuId:"m3", label:"About",   url:"/about",    target:"_self", order:3 },
      { id:"mi16", menuId:"m3", label:"Contact", url:"/contact",  target:"_self", order:4 },
    ],
  },
];

// ── Blog Posts ────────────────────────────────────────────────────────────────
export const BLOG_POSTS: BlogPost[] = [
  { id:"b1", slug:"uae-visa-requirements-2025", title:"UAE Visa Requirements for 2025 — Complete Guide", excerpt:"Everything you need to know about UAE visa requirements, types, fees and processing times.", category:"Visa", tags:["visa","uae","guide"], author:"Omar Hassan", status:"published", publishedAt:"10 Jan 2025", updatedAt:"10 Jan 2025", views:8241, content:"<p>The UAE offers several visa categories depending on your purpose of visit...</p>" },
  { id:"b2", slug:"best-hotels-dubai-2025",     title:"10 Best Hotels in Dubai for 2025",                 excerpt:"Our curated list of the finest hotels in Dubai for every budget.",                        category:"Hotels",  tags:["hotels","dubai"],  author:"Ayesha Rahman", status:"published", publishedAt:"08 Jan 2025", updatedAt:"08 Jan 2025", views:5122, content:"<p>Dubai is home to some of the world's most iconic hotels...</p>" },
  { id:"b3", slug:"hajj-guide-2025",            title:"Hajj 2025 Complete Preparation Guide",              excerpt:"Step by step guide to preparing for your Hajj journey.",                                  category:"Hajj",    tags:["hajj","guide"],    author:"Admin",         status:"published", publishedAt:"05 Jan 2025", updatedAt:"05 Jan 2025", views:12088,content:"<p>Hajj is one of the five pillars of Islam and a spiritual journey of a lifetime...</p>" },
  { id:"b4", slug:"schengen-visa-tips",         title:"Top Tips for Schengen Visa Approval in 2025",      excerpt:"Proven tips to ensure your Schengen visa application is approved first time.",               category:"Visa",    tags:["visa","europe"],   author:"Omar Hassan",   status:"draft",    updatedAt:"13 Jan 2025", views:0,    content:"<p>The Schengen visa is one of the most sought-after visas...</p>" },
  { id:"b5", slug:"eid-travel-destinations",    title:"Top 5 Eid Travel Destinations from Dubai",         excerpt:"Make the most of Eid holidays with these incredible destinations.",                         category:"Tours",   tags:["tours","eid"],     author:"James Whitfield",status:"scheduled", scheduledAt:"20 Jan 2025", updatedAt:"12 Jan 2025", views:0, content:"<p>Eid is the perfect time to explore new destinations...</p>" },
];

// ── Gallery ───────────────────────────────────────────────────────────────────
export const GALLERY_IMAGES: GalleryImage[] = [
  { id:"gi1", filename:"dubai-skyline.jpg",   alt:"Dubai Skyline",      category:"Destinations", url:"https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400", size:"842 KB", uploadedAt:"05 Jan 2025", usedIn:["Home","About"] },
  { id:"gi2", filename:"passport-office.jpg", alt:"Passport Services",  category:"Office",       url:"https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=400", size:"621 KB", uploadedAt:"03 Jan 2025", usedIn:["Services"] },
  { id:"gi3", filename:"hajj-kaaba.jpg",      alt:"Kaaba Makkah",       category:"Hajj",         url:"https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=400", size:"1.2 MB", uploadedAt:"01 Jan 2025", usedIn:["Hajj & Umrah"] },
  { id:"gi4", filename:"airport-lounge.jpg",  alt:"Airport Lounge",     category:"Travel",       url:"https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400", size:"934 KB", uploadedAt:"01 Jan 2025", usedIn:["Flights"] },
  { id:"gi5", filename:"hotel-pool.jpg",      alt:"Luxury Hotel Pool",  category:"Hotels",       url:"https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400", size:"756 KB", uploadedAt:"02 Jan 2025", usedIn:["Hotels"] },
  { id:"gi6", filename:"team-photo.jpg",      alt:"Our Team",           category:"Office",       url:"https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400", size:"1.1 MB", uploadedAt:"02 Jan 2025", usedIn:["About"] },
];

// ── Sliders ───────────────────────────────────────────────────────────────────
export const SLIDERS: Slider[] = [
  {
    id:"sl1", name:"Homepage Hero", location:"home_hero", slideCount:3, autoplay:true, interval:5000, active:true, updatedAt:"10 Jan 2025",
    slides:[
      { id:"s1", sliderId:"sl1", title:"Your Journey Starts Here", subtitle:"Visas · Flights · Hotels · Tours", imageUrl:"https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800", ctaText:"Explore Services", ctaUrl:"/services", order:1, active:true },
      { id:"s2", sliderId:"sl1", title:"Hajj & Umrah 2025", subtitle:"Book your spiritual journey today", imageUrl:"https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800", ctaText:"Learn More", ctaUrl:"/hajj-umrah", order:2, active:true },
      { id:"s3", sliderId:"sl1", title:"Eid Travel Deals", subtitle:"Special packages from AED 999", imageUrl:"https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800", ctaText:"View Packages", ctaUrl:"/tours", order:3, active:false },
    ],
  },
  {
    id:"sl2", name:"Services Banner", location:"services_top", slideCount:2, autoplay:false, interval:0, active:true, updatedAt:"08 Jan 2025",
    slides:[
      { id:"s4", sliderId:"sl2", title:"Visa Made Easy",   subtitle:"Fast processing, expert support",    imageUrl:"https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800", ctaText:"Apply Now", ctaUrl:"/visa", order:1, active:true },
      { id:"s5", sliderId:"sl2", title:"Hotel Deals 2025", subtitle:"Best rates guaranteed",              imageUrl:"https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800", ctaText:"Book Now",  ctaUrl:"/hotels", order:2, active:true },
    ],
  },
];

// ── Popups / Banners ──────────────────────────────────────────────────────────
export const POPUPS: Popup[] = [
  { id:"pp1", name:"Eid Promo Popup",      type:"modal",         title:"🎉 Special Eid Offer!",         content:"Book any package before 20 Jan and get 15% off. Use code EID2025.", ctaText:"Book Now",    ctaUrl:"/promotions", triggerDelay:5,  showOnPages:["Home"],        active:true,  startDate:"10 Jan 2025", endDate:"20 Jan 2025", impressions:4821, clicks:312  },
  { id:"pp2", name:"Newsletter Signup",    type:"slide_in",      title:"Stay Updated",                   content:"Subscribe to get travel deals, visa tips and more.",               ctaText:"Subscribe",   ctaUrl:"/subscribe",  triggerDelay:15, showOnPages:["Home","Blog"], active:true,  impressions:8200, clicks:441  },
  { id:"pp3", name:"Hajj Season Banner",   type:"banner_top",    title:"Hajj 2025 Packages Now Available",content:"Limited seats — early registration discount available.",            ctaText:"Register",    ctaUrl:"/hajj-umrah", triggerDelay:0,  showOnPages:["*"],           active:false, startDate:"01 Feb 2025", endDate:"01 Mar 2025", impressions:0, clicks:0 },
  { id:"pp4", name:"Cookie Consent",       type:"banner_bottom", title:"We use cookies",                 content:"This website uses cookies to enhance your experience.",            ctaText:"Accept",      ctaUrl:"",            triggerDelay:0,  showOnPages:["*"],           active:true,  impressions:31200, clicks:28900 },
];

// ── Content Blocks ────────────────────────────────────────────────────────────
export const CONTENT_BLOCKS: ContentBlock[] = [
  { id:"cb1", name:"Company Address Block", zone:"footer",  description:"Company address, phone, email in footer", content:"<address>TravelPro LLC<br>Office 1204, Al Moosa Tower 2<br>Sheikh Zayed Road, Dubai, UAE<br>+971 4 123 4567</address>", active:true, updatedAt:"05 Jan 2025" },
  { id:"cb2", name:"Hero CTA Block",        zone:"home",    description:"Main CTA section below hero slider",       content:"<section class='cta'><h2>Ready to Travel?</h2><p>Get a free consultation from our experts</p><a href='/contact'>Contact Us</a></section>", active:true, updatedAt:"10 Jan 2025" },
  { id:"cb3", name:"About Intro Block",     zone:"about",   description:"Short company intro paragraph",            content:"<p>Since 2005, TravelPro has been helping thousands of travellers from the UAE explore the world with confidence.</p>", active:true, updatedAt:"08 Jan 2025" },
  { id:"cb4", name:"Header Announcement",   zone:"header",  description:"Scrolling announcement bar above nav",     content:"📞 24/7 Support: +971 4 123 4567 | ✉ info@travelpro.ae | 🕐 Open Daily 8am–10pm", active:true, updatedAt:"11 Jan 2025" },
  { id:"cb5", name:"Checkout Trust Block",  zone:"checkout",description:"Trust badges and payment logos",           content:"<div>🔒 Secure Payment | IATA Certified | 10,000+ Happy Clients | 24/7 Support</div>", active:true, updatedAt:"01 Jan 2025" },
];

// ── SEO Records ───────────────────────────────────────────────────────────────
export const SEO_RECORDS: SeoRecord[] = [
  { id:"seo1", pageTitle:"Home",          slug:"/",          metaTitle:"TravelPro — Visa, Flights, Hotels & Tours UAE",     metaDescription:"Book flights, visas, hotels and tours with TravelPro. IATA certified travel agency in Dubai, UAE.", ogTitle:"TravelPro UAE", ogDescription:"Your trusted travel partner in UAE.", noIndex:false, sitemapPriority:"1.0"  },
  { id:"seo2", pageTitle:"Visa Services", slug:"/visa",      metaTitle:"Visa Services UAE | TravelPro — Fast Processing",   metaDescription:"Professional visa processing for 180+ countries. Tourist, work, student and family visas.", ogTitle:"Visa Services | TravelPro", ogDescription:"Professional visa processing for 180+ countries.", noIndex:false, sitemapPriority:"0.8"  },
  { id:"seo3", pageTitle:"About Us",      slug:"/about",     metaTitle:"About TravelPro | 20 Years in UAE Travel Industry", metaDescription:"Learn about TravelPro's history, team, and our commitment to customer excellence.", ogTitle:"About TravelPro", ogDescription:"20 years serving UAE travellers.", noIndex:false, sitemapPriority:"0.5"  },
  { id:"seo4", pageTitle:"Blog",          slug:"/blog",      metaTitle:"Travel Tips & Visa Guides — TravelPro Blog",        metaDescription:"Expert travel tips, visa guides, and destination inspiration from TravelPro.", ogTitle:"TravelPro Blog", ogDescription:"Expert travel tips and visa guides.", noIndex:false, sitemapPriority:"0.8"  },
  { id:"seo5", pageTitle:"Privacy Policy",slug:"/privacy",   metaTitle:"Privacy Policy | TravelPro",                        metaDescription:"TravelPro privacy policy — how we collect, use and protect your data.", ogTitle:"Privacy Policy", ogDescription:"How TravelPro handles your data.", noIndex:true,  sitemapPriority:"0.1"  },
];
