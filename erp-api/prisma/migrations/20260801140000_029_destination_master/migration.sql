-- Phase E3: Destination Master — shared entity packages reference (additive).

CREATE TABLE IF NOT EXISTS "DestinationMaster" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "countryCode" TEXT,
  "isoCode" TEXT,
  "flagEmoji" TEXT,
  "flagUrl" TEXT,
  "heroImageUrl" TEXT,
  "galleryJson" JSONB,
  "region" TEXT,
  "visaRequired" BOOLEAN NOT NULL DEFAULT true,
  "popular" BOOLEAN NOT NULL DEFAULT false,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "homepageFeatured" BOOLEAN NOT NULL DEFAULT false,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "seoTitle" TEXT,
  "seoDescription" TEXT,
  "description" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "mapEmbedUrl" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "DestinationMaster_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "DestinationMaster_slug_key" ON "DestinationMaster"("slug");
CREATE INDEX IF NOT EXISTS "DestinationMaster_status_idx" ON "DestinationMaster"("status");
CREATE INDEX IF NOT EXISTS "DestinationMaster_homepageFeatured_idx" ON "DestinationMaster"("homepageFeatured");
CREATE INDEX IF NOT EXISTS "DestinationMaster_popular_idx" ON "DestinationMaster"("popular");
CREATE INDEX IF NOT EXISTS "DestinationMaster_region_idx" ON "DestinationMaster"("region");
CREATE INDEX IF NOT EXISTS "DestinationMaster_displayOrder_idx" ON "DestinationMaster"("displayOrder");
CREATE INDEX IF NOT EXISTS "DestinationMaster_countryCode_idx" ON "DestinationMaster"("countryCode");

ALTER TABLE "PackageMaster" ADD COLUMN IF NOT EXISTS "destinationId" TEXT;
CREATE INDEX IF NOT EXISTS "PackageMaster_destinationId_idx" ON "PackageMaster"("destinationId");
ALTER TABLE "PackageMaster" ADD CONSTRAINT "PackageMaster_destinationId_fkey"
  FOREIGN KEY ("destinationId") REFERENCES "DestinationMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed homepage-featured destinations
INSERT INTO "DestinationMaster" (
  "id", "name", "slug", "country", "countryCode", "isoCode", "flagEmoji", "region",
  "heroImageUrl", "displayOrder", "status", "popular", "featured", "homepageFeatured",
  "description", "seoTitle", "seoDescription", "createdAt", "updatedAt"
) VALUES
  ('d0000001-0001-4000-8000-000000000001', 'China', 'china', 'China', 'CN', 'CN', '🇨🇳', 'Asia',
   'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1200', 1, 'published', true, true, true,
   'Explore visa, tour, and business travel packages to China.', 'China Travel | Shanghai Travels', 'Visa and tour packages to China from Bangladesh.', NOW(), NOW()),
  ('d0000001-0001-4000-8000-000000000002', 'Bangladesh', 'bangladesh', 'Bangladesh', 'BD', 'BD', '🇧🇩', 'Asia',
   'https://images.unsplash.com/photo-1586500036706-1744b7755d71?w=1200', 2, 'published', true, true, true,
   'Domestic and inbound travel across Bangladesh.', 'Bangladesh Travel | Shanghai Travels', 'Discover Bangladesh travel services.', NOW(), NOW()),
  ('d0000001-0001-4000-8000-000000000003', 'Thailand', 'thailand', 'Thailand', 'TH', 'TH', '🇹🇭', 'Asia',
   'https://images.unsplash.com/photo-1552465011-b85e21bf76a5?w=1200', 3, 'published', true, true, true,
   'Bangkok, Phuket, and Pattaya tour and visa packages.', 'Thailand Travel | Shanghai Travels', 'Thailand holidays and visa assistance.', NOW(), NOW()),
  ('d0000001-0001-4000-8000-000000000004', 'Malaysia', 'malaysia', 'Malaysia', 'MY', 'MY', '🇲🇾', 'Asia',
   'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1200', 4, 'published', true, true, true,
   'Kuala Lumpur, Langkawi, and Penang packages.', 'Malaysia Travel | Shanghai Travels', 'Malaysia tour and visa packages.', NOW(), NOW()),
  ('d0000001-0001-4000-8000-000000000005', 'Singapore', 'singapore', 'Singapore', 'SG', 'SG', '🇸🇬', 'Asia',
   'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200', 5, 'published', true, true, true,
   'City breaks and transit packages to Singapore.', 'Singapore Travel | Shanghai Travels', 'Singapore tour packages from Bangladesh.', NOW(), NOW()),
  ('d0000001-0001-4000-8000-000000000006', 'Dubai', 'dubai', 'United Arab Emirates', 'AE', 'AE', '🇦🇪', 'Middle East',
   'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200', 6, 'published', true, true, true,
   'UAE visa, Dubai holidays, and stopover packages.', 'Dubai & UAE Travel | Shanghai Travels', 'Dubai and UAE travel packages.', NOW(), NOW()),
  ('d0000001-0001-4000-8000-000000000007', 'Saudi Arabia', 'saudi-arabia', 'Saudi Arabia', 'SA', 'SA', '🇸🇦', 'Middle East',
   'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=1200', 7, 'published', true, true, true,
   'Hajj, Umrah, and business travel to Saudi Arabia.', 'Saudi Arabia Travel | Shanghai Travels', 'Hajj, Umrah, and KSA visa packages.', NOW(), NOW()),
  ('d0000001-0001-4000-8000-000000000008', 'Qatar', 'qatar', 'Qatar', 'QA', 'QA', '🇶🇦', 'Middle East',
   'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=1200', 8, 'published', true, true, true,
   'Doha stopovers and Qatar visit packages.', 'Qatar Travel | Shanghai Travels', 'Qatar visa and tour packages.', NOW(), NOW()),
  ('d0000001-0001-4000-8000-000000000009', 'United Kingdom', 'united-kingdom', 'United Kingdom', 'GB', 'GB', '🇬🇧', 'Europe',
   'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200', 9, 'published', true, true, true,
   'UK visa and student travel support.', 'UK Travel | Shanghai Travels', 'United Kingdom visa and travel packages.', NOW(), NOW()),
  ('d0000001-0001-4000-8000-000000000010', 'United States', 'united-states', 'United States', 'US', 'US', '🇺🇸', 'Americas',
   'https://images.unsplash.com/photo-1485738422979-f2995cc9fd98?w=1200', 10, 'published', true, true, true,
   'USA visa consultation and tour packages.', 'USA Travel | Shanghai Travels', 'United States visa and travel services.', NOW(), NOW()),
  ('d0000001-0001-4000-8000-000000000011', 'Canada', 'canada', 'Canada', 'CA', 'CA', '🇨🇦', 'Americas',
   'https://images.unsplash.com/photo-1519832979-6fa067bd9f56?w=1200', 11, 'published', true, true, true,
   'Canada visa, student, and visit packages.', 'Canada Travel | Shanghai Travels', 'Canada visa and immigration travel.', NOW(), NOW()),
  ('d0000001-0001-4000-8000-000000000012', 'Australia', 'australia', 'Australia', 'AU', 'AU', '🇦🇺', 'Oceania',
   'https://images.unsplash.com/photo-1523482580670-f9713431e9f0?w=1200', 12, 'published', true, true, true,
   'Australia visa, student, and holiday packages.', 'Australia Travel | Shanghai Travels', 'Australia travel and visa packages.', NOW(), NOW())
ON CONFLICT ("slug") DO NOTHING;

-- CMS showcase settings (destination_showcase / homepage-settings)
INSERT INTO "CmsContent" (
  "id", "type", "slug", "title", "summary", "body", "meta", "status", "publishedAt", "createdBy", "createdAt", "updatedAt"
)
SELECT
  'd0000001-0001-4000-8000-000000000099',
  'destination_showcase',
  'homepage-settings',
  'Destination Homepage Showcase',
  '{"maxCards":8,"showPackageCount":true,"showRegion":true,"showFlag":true,"showHeroImage":true,"showCta":true,"ctaLabel":"Explore Destination","enabled":true}',
  '',
  '{"maxCards":8,"showPackageCount":true,"showRegion":true,"showFlag":true,"showHeroImage":true,"showCta":true,"ctaLabel":"Explore Destination","enabled":true}'::jsonb,
  'published',
  NOW(),
  'migration',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "CmsContent" WHERE "type" = 'destination_showcase' AND "slug" = 'homepage-settings'
);

-- Best-effort link packages to destinations by country/destination name
UPDATE "PackageMaster" pm SET "destinationId" = d."id"
FROM "DestinationMaster" d
WHERE pm."destinationId" IS NULL
  AND pm."deletedAt" IS NULL
  AND (
    pm."country" ILIKE d."country"
    OR pm."country" ILIKE d."name"
    OR pm."destination" ILIKE d."name"
    OR pm."destination" ILIKE d."country"
    OR (d."slug" = 'dubai' AND (pm."country" ILIKE '%uae%' OR pm."destination" ILIKE '%dubai%' OR pm."destination" ILIKE '%uae%'))
    OR (d."slug" = 'united-kingdom' AND (pm."country" ILIKE '%uk%' OR pm."country" ILIKE '%united kingdom%' OR pm."destination" ILIKE '%london%'))
    OR (d."slug" = 'united-states' AND (pm."country" ILIKE '%usa%' OR pm."country" ILIKE '%united states%' OR pm."destination" ILIKE '%usa%'))
    OR (d."slug" = 'saudi-arabia' AND (pm."country" ILIKE '%saudi%' OR pm."destination" ILIKE '%makkah%' OR pm."destination" ILIKE '%madinah%'))
  );
