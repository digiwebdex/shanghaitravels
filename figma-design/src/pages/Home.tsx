import { useEffect, useState } from "react";
import {
  fetchBanners,
  fetchContent,
  fetchContentBySlug,
  fetchDestinations,
  fetchPackages,
  pickHeroBanner,
  type CmsBanner,
  type CmsContent,
  type DestinationRow,
  type DestinationSettings,
  type PackageRow,
} from "../home/v4/api";
import { HeroPremium } from "../home/v4/HeroPremium";
import { FeaturedPackages } from "../home/v4/FeaturedPackages";
import { PopularDestinations } from "../home/v4/PopularDestinations";
import { StatsBar } from "../home/v4/StatsBar";
import { ServicesGrid } from "../home/v4/ServicesGrid";
import { Testimonials } from "../home/v4/Testimonials";
import { Partners } from "../home/v4/Partners";
import { CtaBanner } from "../home/v4/CtaBanner";
import { BlogLatest } from "../home/v4/BlogLatest";

/**
 * Section order mirrors the approved reference frame:
 * hero → featured packages → destinations → stats → services →
 * testimonials → partners → CTA → blog → footer (newsletter lives in the footer).
 */
export default function Home() {
  const [heroBanner, setHeroBanner] = useState<CmsBanner | null>(null);
  const [ctaBanner, setCtaBanner] = useState<CmsBanner | null>(null);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [destinations, setDestinations] = useState<DestinationRow[]>([]);
  const [destSettings, setDestSettings] = useState<DestinationSettings>({});
  const [destLoading, setDestLoading] = useState(true);
  const [statsContent, setStatsContent] = useState<CmsContent | null>(null);
  const [heroServices, setHeroServices] = useState<CmsContent[]>([]);
  const [services, setServices] = useState<CmsContent[]>([]);
  const [testimonials, setTestimonials] = useState<CmsContent[]>([]);
  const [partnersGallery, setPartnersGallery] = useState<CmsContent | null>(null);
  const [blogPosts, setBlogPosts] = useState<CmsContent[]>([]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [
        banners,
        ctaBanners,
        pkgList,
        destData,
        stats,
        heroServiceList,
        serviceList,
        testimonialList,
        partners,
        blogs,
      ] = await Promise.all([
        fetchBanners("hero").catch(() => [] as CmsBanner[]),
        fetchBanners("cta").catch(() => [] as CmsBanner[]),
        fetchPackages(10).catch(() => [] as PackageRow[]),
        fetchDestinations().catch(() => ({ rows: [] as DestinationRow[], settings: {} as DestinationSettings })),
        fetchContentBySlug("announcement", "homepage-stats").catch(() => null),
        fetchContent("hero_service").catch(() => [] as CmsContent[]),
        fetchContent("service").catch(() => [] as CmsContent[]),
        fetchContent("testimonial").catch(() => [] as CmsContent[]),
        fetchContentBySlug("gallery", "trusted-partners").catch(() => null),
        fetchContent("blog").catch(() => [] as CmsContent[]),
      ]);

      if (cancelled) return;

      setHeroBanner(pickHeroBanner(banners));
      setCtaBanner(ctaBanners[0] ?? null);
      setPackages(pkgList);
      setPackagesLoading(false);
      setDestinations(destData.rows);
      setDestSettings(destData.settings);
      setDestLoading(false);
      setStatsContent(stats);
      setHeroServices(heroServiceList);
      setServices(serviceList);
      setTestimonials(testimonialList);
      setPartnersGallery(partners);
      setBlogPosts(blogs);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <HeroPremium banner={heroBanner} services={heroServices} />
      <FeaturedPackages packages={packages} loading={packagesLoading} />
      <PopularDestinations destinations={destinations} settings={destSettings} loading={destLoading} />
      <StatsBar content={statsContent} />
      <ServicesGrid services={services} />
      <Testimonials items={testimonials} />
      <Partners gallery={partnersGallery} />
      <CtaBanner banner={ctaBanner} />
      <BlogLatest posts={blogPosts} />
    </>
  );
}
