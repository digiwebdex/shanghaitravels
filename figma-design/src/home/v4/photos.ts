/**
 * Curated fallback photography for the V4 homepage.
 *
 * The CMS, Package Engine and Destination Master always win: these frames are
 * only reached when a record ships no image, or when the image it ships fails
 * to load. Before that they rendered as a flat navy gradient, which read as a
 * placeholder rather than as a travel site.
 *
 * Every id below was fetched and eyeballed before being added — Unsplash serves
 * 404s for retired photos, so an unverified id is a broken card.
 */

/** One grade for every fallback frame so the page reads as a single shoot. */
export function photoUrl(id: string, width = 1200): string {
  return `https://images.unsplash.com/photo-${id}?w=${width}&q=80&auto=format&fit=crop`;
}

/**
 * Cinematic wide frame behind the hero: the Pudong skyline at dawn, mirrored in
 * the Huangpu.
 *
 * The hero crops to roughly 3.2:1 on desktop and to a tall 0.75:1 on a phone,
 * which ruins any photo with a strong foreground subject — a horizontal skyline
 * survives both. Its pale dawn wash also measures ~230/255 behind the headline
 * once the scrim composites, leaving navy type at about 12.8:1.
 */
export const HERO_PHOTO = photoUrl("1545893835-abaa50cbe628", 2400);

/** Warm departure-lounge frame behind the consultation banner. */
export const CTA_PHOTO = photoUrl("1488646953014-85cb44e25828", 900);

/** Landmark frames keyed by country, country code and well-known city. */
const PLACE_PHOTOS: Record<string, string[]> = {
  "united arab emirates": ["1512453979798-5ea266f8880c", "1546412414-e1885259563a", "1512632578888-169bbbc64f33"],
  ae: ["1512453979798-5ea266f8880c", "1546412414-e1885259563a"],
  dubai: ["1512453979798-5ea266f8880c", "1546412414-e1885259563a"],
  "abu dhabi": ["1512632578888-169bbbc64f33"],

  "saudi arabia": ["1580418827493-f2b22c0a76cb", "1591604129939-f1efa4d9f7fa", "1564769625905-50e93615e769"],
  sa: ["1580418827493-f2b22c0a76cb", "1591604129939-f1efa4d9f7fa"],
  makkah: ["1580418827493-f2b22c0a76cb", "1564769625905-50e93615e769"],
  mecca: ["1564769625905-50e93615e769"],
  madinah: ["1591604129939-f1efa4d9f7fa"],
  medina: ["1591604129939-f1efa4d9f7fa"],
  riyadh: ["1586724237569-f3d0c1dee8c6"],

  thailand: ["1528181304800-259b08848526", "1583417319070-4a69db38a482", "1519451241324-20b4ea2c4220"],
  th: ["1528181304800-259b08848526", "1583417319070-4a69db38a482"],
  bangkok: ["1583417319070-4a69db38a482", "1528181304800-259b08848526"],
  phuket: ["1519451241324-20b4ea2c4220"],

  malaysia: ["1596422846543-75c6fc197f07", "1508964942454-1a56651d54ac"],
  my: ["1596422846543-75c6fc197f07"],
  "kuala lumpur": ["1596422846543-75c6fc197f07"],

  singapore: ["1565967511849-76a60a516170", "1508964942454-1a56651d54ac"],
  sg: ["1565967511849-76a60a516170", "1508964942454-1a56651d54ac"],

  indonesia: ["1544644181-1484b3fdfc62", "1518548419970-58e3b4079ab2", "1570789210967-2cac24afeb00"],
  id: ["1544644181-1484b3fdfc62", "1518548419970-58e3b4079ab2"],
  bali: ["1544644181-1484b3fdfc62", "1518548419970-58e3b4079ab2"],

  china: ["1508804185872-d7badad00f7d", "1545893835-abaa50cbe628", "1474181487882-5abf3f0ba6c2"],
  cn: ["1508804185872-d7badad00f7d", "1545893835-abaa50cbe628", "1474181487882-5abf3f0ba6c2"],
  shanghai: ["1545893835-abaa50cbe628", "1474181487882-5abf3f0ba6c2"],

  japan: ["1524413840807-0c3cb6fa808d", "1493976040374-85c8e12f0c0e"],
  jp: ["1524413840807-0c3cb6fa808d", "1493976040374-85c8e12f0c0e"],
  tokyo: ["1493976040374-85c8e12f0c0e"],

  india: ["1548013146-72479768bada", "1587474260584-136574528ed5", "1595815771614-ade9d652a65d"],
  in: ["1548013146-72479768bada", "1587474260584-136574528ed5"],
  delhi: ["1587474260584-136574528ed5"],
  agra: ["1548013146-72479768bada"],

  "united kingdom": ["1513635269975-59663e0ac1ad", "1533929736458-ca588d08c8be"],
  gb: ["1513635269975-59663e0ac1ad", "1533929736458-ca588d08c8be"],
  uk: ["1513635269975-59663e0ac1ad"],
  london: ["1533929736458-ca588d08c8be", "1513635269975-59663e0ac1ad"],

  "united states": ["1449034446853-66c86144b0ad", "1470004914212-05527e49370b"],
  us: ["1449034446853-66c86144b0ad"],
  usa: ["1449034446853-66c86144b0ad"],

  canada: ["1493246507139-91e8fad9978e", "1464822759023-fed622ff2c3b"],
  ca: ["1493246507139-91e8fad9978e"],

  turkey: ["1541432901042-2d8bd64b4a9b", "1524231757912-21f4fe3a7200", "1527838832700-5059252407fa"],
  tr: ["1541432901042-2d8bd64b4a9b", "1524231757912-21f4fe3a7200"],
  istanbul: ["1524231757912-21f4fe3a7200", "1541432901042-2d8bd64b4a9b"],

  maldives: ["1514282401047-d79a71a590e8", "1512100356356-de1b84283e18", "1516815231560-8f41ec531527"],
  mv: ["1514282401047-d79a71a590e8", "1512100356356-de1b84283e18"],

  australia: ["1523482580672-f109ba8cb9be"],
  au: ["1523482580672-f109ba8cb9be"],

  france: ["1502602898657-3e91760cbb34"],
  fr: ["1502602898657-3e91760cbb34"],
  paris: ["1502602898657-3e91760cbb34"],
  italy: ["1523906834658-6e24ef2386f9"],
  it: ["1523906834658-6e24ef2386f9"],
  venice: ["1523906834658-6e24ef2386f9"],
  greece: ["1613395877344-13d4a8e0d49e", "1533105079780-92b9be482077"],
  gr: ["1613395877344-13d4a8e0d49e"],
  spain: ["1583422409516-2895a77efded"],
  es: ["1583422409516-2895a77efded"],

  europe: ["1502602898657-3e91760cbb34", "1523906834658-6e24ef2386f9", "1519677100203-a0e668c92439"],
  schengen: ["1519677100203-a0e668c92439", "1502602898657-3e91760cbb34"],
  brazil: ["1483729558449-99ef09a8c325"],

  bangladesh: ["1622308644420-b20142dc993c"],
  bd: ["1622308644420-b20142dc993c"],
};

/** Product frames keyed by package category, used when no place matches. */
const CATEGORY_PHOTOS: Record<string, string[]> = {
  hajj: ["1564769625905-50e93615e769", "1580418827493-f2b22c0a76cb"],
  umrah: ["1591604129939-f1efa4d9f7fa", "1519817650390-64a93db51149"],
  visa: ["1554224155-6726b3ff858f", "1521295121783-8a321d551ad2"],
  passport: ["1554224155-6726b3ff858f"],
  flight: ["1436491865332-7a61a109cc05", "1580674285054-bed31e145f59"],
  air: ["1436491865332-7a61a109cc05", "1580674285054-bed31e145f59"],
  ticket: ["1580674285054-bed31e145f59"],
  hotel: ["1571896349842-33c89424de2d", "1590490360182-c33d57733427", "1566073771259-6a8506099945"],
  resort: ["1509233725247-49e657c54213", "1571896349842-33c89424de2d"],
  honeymoon: ["1507525428034-b723cf961d3e", "1582719508461-905c673771fd"],
  beach: ["1502117859338-fd9daa518a9a", "1507525428034-b723cf961d3e"],
  island: ["1519451241324-20b4ea2c4220", "1570789210967-2cac24afeb00"],
  desert: ["1559827260-dc66d52bef19"],
  mountain: ["1493246507139-91e8fad9978e", "1506905925346-21bda4d32df4"],
  tour: ["1476514525535-07fb3b4ae5f1", "1469854523086-cc02fe5d8800"],
  student: ["1454165804606-c3d57bc86b40"],
  work: ["1454165804606-c3d57bc86b40"],
  medical: ["1517842645767-c639042777db"],
  transport: ["1469854523086-cc02fe5d8800"],
};

/** Last resort: wide, bright, unmistakably premium travel frames. */
const GENERIC_PHOTOS = [
  "1502117859338-fd9daa518a9a",
  "1476514525535-07fb3b4ae5f1",
  "1506905925346-21bda4d32df4",
  "1439066615861-d1af74d74000",
  "1470071459604-3b5ec3a7fe05",
  "1507525428034-b723cf961d3e",
];

/** Editorial frames for blog cards with no cover image. */
const JOURNAL_PHOTOS = [
  "1521295121783-8a321d551ad2",
  "1517842645767-c639042777db",
  "1488646953014-85cb44e25828",
  "1454165804606-c3d57bc86b40",
  "1469854523086-cc02fe5d8800",
  "1441974231531-c6227db76b6e",
];

function normalise(value: unknown): string {
  return typeof value === "string" ? value.toLowerCase().trim() : "";
}

/** Stable index so a given card always resolves to the same frame. */
function hashIndex(seed: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return length ? hash % length : 0;
}

function lookup(table: Record<string, string[]>, hints: string[]): string[] | null {
  for (const hint of hints) {
    if (!hint) continue;
    if (table[hint]) return table[hint];
  }
  // Fall back to containment so "Makkah & Madinah" or "Hajj Economy 2026" match.
  for (const hint of hints) {
    if (hint.length < 3) continue;
    for (const key of Object.keys(table)) {
      if (key.length >= 3 && hint.includes(key)) return table[key];
    }
  }
  return null;
}

type PhotoQuery = {
  /** Country, city or region names, most specific first. */
  places?: unknown[];
  /** Package category, type or title text. */
  subjects?: unknown[];
  /** Keeps repeated cards in one country on different frames. */
  seed?: string;
  /**
   * Position of the card in its row. Hashing alone lets four adjacent cards
   * collide on one frame, which looks like a bug; walking the pool by position
   * guarantees a row never repeats itself.
   */
  rotate?: number;
  width?: number;
  /** Use the editorial set rather than the scenic set as the last resort. */
  editorial?: boolean;
};

/** Resolves the best curated frame for a card that has no usable image. */
export function fallbackPhoto({
  places = [],
  subjects = [],
  seed = "",
  rotate,
  width = 1200,
  editorial = false,
}: PhotoQuery): string {
  const placeHints = places.map(normalise).filter(Boolean);
  const subjectHints = subjects.map(normalise).filter(Boolean);

  const pool =
    lookup(PLACE_PHOTOS, placeHints) ??
    lookup(CATEGORY_PHOTOS, subjectHints) ??
    lookup(PLACE_PHOTOS, subjectHints) ??
    (editorial ? JOURNAL_PHOTOS : GENERIC_PHOTOS);

  const index =
    rotate == null
      ? hashIndex(seed || placeHints[0] || subjectHints[0] || "st", pool.length)
      : ((rotate % pool.length) + pool.length) % pool.length;

  return photoUrl(pool[index], width);
}
