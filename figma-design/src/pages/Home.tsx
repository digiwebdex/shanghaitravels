import { useEffect, useState } from "react";
import {
  fetchBanners,
  fetchContent,
  fetchContentBySlug,
  fetchDestinations,
  fetchPackages,
  type CmsBanner,
  type CmsContent,
  type DestinationRow,
  type DestinationSettings,
  type PackageRow,
} from "../home/v4/api";
import { HeroPremium } from "../home/v4/HeroPremium";
import { FeaturedPackages } from "../home/v4/FeaturedPackages";
import { PopularDestinations } from "../home/v4/PopularDestinations";
import { WhyChoose } from "../home/v4/WhyChoose";
import { StatsBar } from "../home/v4/StatsBar";
import { ServicesGrid } from "../home/v4/ServicesGrid";
import { Testimonials } from "../home/v4/Testimonials";
import { Partners } from "../home/v4/Partners";
import { CtaBanner } from "../home/v4/CtaBanner";
import { BlogLatest } from "../home/v4/BlogLatest";
import { FaqSection } from "../home/v4/FaqSection";
import { Newsletter } from "../home/v4/Newsletter";

export default function Home() {
  const [heroBanner, setHeroBanner] = useState<CmsBanner | null>(null);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [destinations, setDestinations] = useState<DestinationRow[]>([]);
  const [destSettings, setDestSettings] = useState<DestinationSettings>({});
  const [destLoading, setDestLoading] = useState(true);
  const [whyContent, setWhyContent] = useState<CmsContent | null>(null);
  const [statsContent, setStatsContent] = useState<CmsContent | null>(null);
  const [heroServices, setHeroServices] = useState<CmsContent[]>([]);
  const [testimonials, setTestimonials] = useState<CmsContent[]>([]);
  const [partnersGallery, setPartnersGallery] = useState<CmsContent | null>(null);
  const [blogPosts, setBlogPosts] = useState<CmsContent[]>([]);
  const [faqs, setFaqs] = useState<CmsContent[]>([]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [banners, pkgList, destData, why, stats, services, testimonialList, partners, blogs, faqList] =
        await Promise.all([
          fetchBanners("hero").catch(() => [] as CmsBanner[]),
          fetchPackages(8).catch(() => [] as PackageRow[]),
          fetchDestinations().catch(() => ({ rows: [] as DestinationRow[], settings: {} as DestinationSettings })),
          fetchContentBySlug("announcement", "homepage-why").catch(() => null),
          fetchContentBySlug("announcement", "homepage-stats").catch(() => null),
          fetchContent("hero_service").catch(() => [] as CmsContent[]),
          fetchContent("testimonial").catch(() => [] as CmsContent[]),
          fetchContentBySlug("gallery", "trusted-partners").catch(() => null),
          fetchContent("blog").catch(() => [] as CmsContent[]),
          fetchContent("faq").catch(() => [] as CmsContent[]),
        ]);

      if (cancelled) return;

      setHeroBanner(banners[0] ?? null);
      setPackages(pkgList);
      setPackagesLoading(false);
      setDestinations(destData.rows);
      setDestSettings(destData.settings);
      setDestLoading(false);
      setWhyContent(why);
      setStatsContent(stats);
      setHeroServices(services);
      setTestimonials(testimonialList);
      setPartnersGallery(partners);
      setBlogPosts(blogs);
      setFaqs(faqList);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <HeroPremium banner={heroBanner} />
      <StatsBar content={statsContent} />
      <FeaturedPackages packages={packages} loading={packagesLoading} />
      <PopularDestinations destinations={destinations} settings={destSettings} loading={destLoading} />
      <WhyChoose content={whyContent} />
      <ServicesGrid heroServices={heroServices} />
      <Testimonials items={testimonials} />
      <Partners gallery={partnersGallery} />
      <CtaBanner />
      <BlogLatest posts={blogPosts} />
      <FaqSection items={faqs} />
      <Newsletter />
    </div>
  );
}
