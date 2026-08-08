import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { AuthedUser } from "../rbac";
import { NotificationsService } from "../notifications/notifications.service";

const PAGE_STATUSES = new Set(["draft", "in_review", "published", "archived"]);
const CONTENT_TYPES = new Set([
  "blog",
  "announcement",
  "faq",
  "testimonial",
  "gallery",
  "download",
  "hero_service",
]);
const HERO_SERVICE_MAX = 6;
const TRAVEL_TYPES = new Set(["visa", "air_ticket", "tour", "hajj", "umrah", "hotel", "transport"]);
const FORM_TYPES = new Set(["contact", "enquiry", "quote", "visa", "tour", "hajj", "career"]);
const LEAD_FORMS = new Set(["contact", "enquiry", "quote", "visa", "tour", "hajj"]);

@Injectable()
export class CmsService {
  constructor(
    private prisma: PrismaService,
    private notes: NotificationsService,
  ) {}

  private isHq(user: AuthedUser) {
    return ["super_admin", "general_manager"].includes(user.role);
  }

  private branchFilter(user: AuthedUser) {
    return this.isHq(user) ? {} : { branchId: user.branchId ?? "__none__" };
  }

  private async audit(userId: string | undefined, action: string, entityType: string, entityId: string | null, after?: unknown) {
    await this.prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entityType,
        entityId,
        after: after == null ? undefined : (after as any),
      },
    });
  }

  private slugify(s: string) {
    return String(s || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);
  }

  // ---------- Bootstrap ----------
  async bootstrap(user: AuthedUser) {
    const pages = [
      ["home", "Home", "Welcome to Shanghai Travels — your partner for China and global travel."],
      ["about", "About Us", "Shanghai Travels operates multi-branch travel services across Bangladesh."],
      ["visa", "Visa Services", "Professional visa processing for China and worldwide destinations."],
      ["flights", "Air Tickets", "Competitive air ticket bookings with dedicated ticketing support."],
      ["tours", "Tour Packages", "Curated tour packages for leisure and corporate groups."],
      ["hajj-umrah", "Hajj & Umrah", "Complete Hajj and Umrah packages with guided support."],
      ["hotels", "Hotels", "Hotel offerings with trusted partners worldwide."],
      ["transport", "Transport", "Airport transfers and ground transport arrangements."],
      ["contact", "Contact", "Reach our branches for enquiries and bookings."],
      ["blog", "News & Blog", "Latest travel news and announcements."],
    ];
    let createdPages = 0;
    for (const [slug, title, body] of pages) {
      const exists = await this.prisma.cmsPage.findFirst({ where: { slug } });
      if (exists) continue;
      await this.prisma.cmsPage.create({
        data: {
          slug,
          title,
          body,
          status: "published",
          published: true,
          publishedAt: new Date(),
          publishedBy: user.id,
          seoTitle: `${title} | Shanghai Travels`,
          seoDescription: body,
          canonicalUrl: `/site/p/${slug}`,
          ogImage: null,
          structuredData: { "@context": "https://schema.org", "@type": "WebPage", name: title },
          blocks: [{ type: "hero", props: { heading: title, text: body } }, { type: "richtext", props: { html: `<p>${body}</p>` } }],
          branchId: user.branchId ?? null,
          updatedBy: user.id,
        },
      });
      createdPages++;
    }

    let menu = await this.prisma.cmsMenu.findFirst({ where: { code: "main" } });
    if (!menu) {
      menu = await this.prisma.cmsMenu.create({
        data: { code: "main", name: "Main navigation", createdBy: user.id, branchId: user.branchId ?? null },
      });
      const items = [
        ["Home", "/#/site", 10],
        ["Visa", "/#/site/p/visa", 20],
        ["Flights", "/#/site/p/flights", 30],
        ["Tours", "/#/site/p/tours", 40],
        ["Hajj & Umrah", "/#/site/p/hajj-umrah", 50],
        ["Contact", "/#/site/enquire", 90],
      ] as const;
      for (const [label, href, sortOrder] of items) {
        await this.prisma.cmsMenuItem.create({ data: { menuId: menu.id, label, href, sortOrder } });
      }
    }

    const bannerExists = await this.prisma.cmsBanner.count();
    if (bannerExists === 0) {
      await this.prisma.cmsBanner.create({
        data: {
          code: "home-hero",
          title: "Travel with Shanghai Travels",
          subtitle: "Visa · Tickets · Tours · Hajj & Umrah",
          linkHref: "/#/site/enquire",
          placement: "hero",
          sortOrder: 10,
          createdBy: user.id,
          branchId: user.branchId ?? null,
        },
      });
    }

    await this.audit(user.id, "cms.bootstrap", "CmsPage", null, { createdPages });
    return { ok: true, createdPages };
  }

  // ---------- Pages ----------
  listPages(q: any, user: AuthedUser) {
    const where: any = { deletedAt: null, ...this.branchFilter(user) };
    if (q.status) where.status = q.status;
    if (q.branchId && this.isHq(user)) where.branchId = q.branchId;
    return this.prisma.cmsPage.findMany({ where, orderBy: { updatedAt: "desc" }, take: 200 });
  }

  async getPage(id: string, user: AuthedUser) {
    const p = await this.prisma.cmsPage.findFirst({
      where: { id, deletedAt: null, ...this.branchFilter(user) },
      include: { versions: { orderBy: { version: "desc" }, take: 20 } },
    });
    if (!p) throw new NotFoundException("Page not found");
    return p;
  }

  async upsertPage(dto: any, user: AuthedUser) {
    if (!dto?.slug?.trim() && !dto?.title?.trim()) throw new BadRequestException("slug or title required");
    const slug = this.slugify(dto.slug || dto.title);
    if (!slug) throw new BadRequestException("Invalid slug");
    const data: any = {
      slug,
      title: String(dto.title || slug).trim(),
      body: dto.body ?? "",
      blocks: dto.blocks ?? undefined,
      templateKey: dto.templateKey || "default",
      seoTitle: dto.seoTitle || null,
      seoDescription: dto.seoDescription || null,
      seoKeywords: dto.seoKeywords || null,
      canonicalUrl: dto.canonicalUrl || `/site/p/${slug}`,
      ogImage: dto.ogImage || null,
      structuredData: dto.structuredData ?? undefined,
      branchId: dto.branchId !== undefined ? dto.branchId : user.branchId ?? null,
      updatedBy: user.id,
    };
    if (dto.status && PAGE_STATUSES.has(dto.status)) data.status = dto.status;
    if (dto.published != null) {
      data.published = !!dto.published;
      if (dto.published) {
        data.status = "published";
        data.publishedAt = new Date();
        data.publishedBy = user.id;
      }
    }
    const existing = await this.prisma.cmsPage.findFirst({ where: { slug, deletedAt: null } });
    const row = existing
      ? await this.prisma.cmsPage.update({ where: { id: existing.id }, data })
      : await this.prisma.cmsPage.create({ data: { ...data, status: data.status || "draft", published: !!data.published } });
    await this.audit(user.id, existing ? "cms.page.update" : "cms.page.create", "CmsPage", row.id, row);
    return row;
  }

  async submitForReview(id: string, user: AuthedUser) {
    const p = await this.getPage(id, user);
    if (p.status === "published") throw new BadRequestException("Published pages must be revised first");
    const row = await this.prisma.cmsPage.update({ where: { id }, data: { status: "in_review", updatedBy: user.id } });
    await this.audit(user.id, "cms.page.review", "CmsPage", id, row);
    return row;
  }

  async publishPage(id: string, user: AuthedUser) {
    const p = await this.getPage(id, user);
    const maxVer = await this.prisma.cmsPageVersion.aggregate({ where: { pageId: id }, _max: { version: true } });
    const version = (maxVer._max.version || 0) + 1;
    await this.prisma.cmsPageVersion.create({
      data: {
        pageId: id,
        version,
        title: p.title,
        body: p.body,
        blocks: p.blocks as any,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        status: "published",
        snapshot: p as any,
        createdBy: user.id,
      },
    });
    const row = await this.prisma.cmsPage.update({
      where: { id },
      data: {
        status: "published",
        published: true,
        publishedAt: new Date(),
        publishedBy: user.id,
        updatedBy: user.id,
      },
    });
    await this.audit(user.id, "cms.page.publish", "CmsPage", id, { version });
    return row;
  }

  async unpublishPage(id: string, user: AuthedUser) {
    await this.getPage(id, user);
    const row = await this.prisma.cmsPage.update({
      where: { id },
      data: { status: "draft", published: false, updatedBy: user.id },
    });
    await this.audit(user.id, "cms.page.unpublish", "CmsPage", id, row);
    return row;
  }

  async deletePage(id: string, user: AuthedUser) {
    await this.getPage(id, user);
    await this.prisma.cmsPage.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit(user.id, "cms.page.delete", "CmsPage", id, null);
    return { ok: true };
  }

  // ---------- Menus ----------
  listMenus(user: AuthedUser) {
    return this.prisma.cmsMenu.findMany({
      where: { ...this.branchFilter(user) },
      include: { items: { orderBy: { sortOrder: "asc" } } },
      orderBy: { code: "asc" },
    });
  }

  async upsertMenu(dto: any, user: AuthedUser) {
    if (!dto?.code?.trim() || !dto?.name?.trim()) throw new BadRequestException("code and name required");
    const code = this.slugify(dto.code);
    const existing = await this.prisma.cmsMenu.findFirst({ where: { code } });
    const menu = existing
      ? await this.prisma.cmsMenu.update({
          where: { id: existing.id },
          data: { name: String(dto.name).trim(), isActive: dto.isActive !== false },
        })
      : await this.prisma.cmsMenu.create({
          data: {
            code,
            name: String(dto.name).trim(),
            createdBy: user.id,
            branchId: user.branchId ?? null,
          },
        });
    if (Array.isArray(dto.items)) {
      await this.prisma.cmsMenuItem.deleteMany({ where: { menuId: menu.id } });
      for (let i = 0; i < dto.items.length; i++) {
        const it = dto.items[i];
        if (!it?.label || !it?.href) continue;
        await this.prisma.cmsMenuItem.create({
          data: {
            menuId: menu.id,
            label: String(it.label),
            href: String(it.href),
            sortOrder: Number(it.sortOrder) || (i + 1) * 10,
            openInNew: !!it.openInNew,
            parentId: it.parentId || null,
          },
        });
      }
    }
    await this.audit(user.id, "cms.menu.upsert", "CmsMenu", menu.id, menu);
    return this.prisma.cmsMenu.findFirst({ where: { id: menu.id }, include: { items: { orderBy: { sortOrder: "asc" } } } });
  }

  // ---------- Media ----------
  listMedia(q: any, user: AuthedUser) {
    const where: any = { deletedAt: null, ...this.branchFilter(user) };
    if (q.folder) where.folder = q.folder;
    return this.prisma.cmsMedia.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 });
  }

  async createMedia(dto: any, user: AuthedUser) {
    if (!dto?.fileName?.trim() || !dto?.storageKey?.trim()) throw new BadRequestException("fileName and storageKey required");
    const row = await this.prisma.cmsMedia.create({
      data: {
        fileName: String(dto.fileName).trim(),
        storageKey: String(dto.storageKey).trim(),
        mimeType: dto.mimeType || "application/octet-stream",
        sizeBytes: Number(dto.sizeBytes) || 0,
        altText: dto.altText || null,
        folder: dto.folder || "general",
        branchId: user.branchId ?? null,
        createdBy: user.id,
      },
    });
    await this.audit(user.id, "cms.media.create", "CmsMedia", row.id, row);
    return row;
  }

  // ---------- Banners ----------
  listBanners(q: any, user: AuthedUser) {
    const where: any = { deletedAt: null, ...this.branchFilter(user) };
    if (q.placement) where.placement = q.placement;
    return this.prisma.cmsBanner.findMany({ where, orderBy: { sortOrder: "asc" }, take: 100 });
  }

  async createBanner(dto: any, user: AuthedUser) {
    if (!dto?.code?.trim() || !dto?.title?.trim()) throw new BadRequestException("code and title required");
    const row = await this.prisma.cmsBanner.create({
      data: {
        code: String(dto.code).trim(),
        title: String(dto.title).trim(),
        subtitle: dto.subtitle || null,
        imageUrl: dto.imageUrl || null,
        linkHref: dto.linkHref || null,
        sortOrder: Number(dto.sortOrder) || 0,
        placement: dto.placement || "hero",
        isActive: dto.isActive !== false,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        branchId: dto.branchId || user.branchId || null,
        createdBy: user.id,
      },
    });
    await this.audit(user.id, "cms.banner.create", "CmsBanner", row.id, row);
    return row;
  }

  // ---------- Redirects ----------
  listRedirects(user: AuthedUser) {
    return this.prisma.cmsRedirect.findMany({
      where: { ...this.branchFilter(user) },
      orderBy: { fromPath: "asc" },
      take: 200,
    });
  }

  async createRedirect(dto: any, user: AuthedUser) {
    if (!dto?.fromPath?.trim() || !dto?.toPath?.trim()) throw new BadRequestException("fromPath and toPath required");
    const row = await this.prisma.cmsRedirect.create({
      data: {
        fromPath: String(dto.fromPath).trim(),
        toPath: String(dto.toPath).trim(),
        statusCode: Number(dto.statusCode) === 302 ? 302 : 301,
        isActive: dto.isActive !== false,
        branchId: user.branchId ?? null,
        createdBy: user.id,
      },
    });
    await this.audit(user.id, "cms.redirect.create", "CmsRedirect", row.id, row);
    return row;
  }

  // ---------- Content ----------
  listContent(q: any, user: AuthedUser) {
    const where: any = { deletedAt: null, ...this.branchFilter(user) };
    if (q.type) where.type = q.type;
    if (q.status) where.status = q.status;
    return this.prisma.cmsContent.findMany({ where, orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }], take: 200 });
  }

  async createContent(dto: any, user: AuthedUser) {
    if (!dto?.type || !CONTENT_TYPES.has(dto.type)) throw new BadRequestException("Invalid content type");
    if (!dto?.title?.trim()) throw new BadRequestException("title required");
    const slug = this.slugify(dto.slug || dto.title);
    const status = dto.status === "published" ? "published" : "draft";
    if (dto.type === "hero_service" && status === "published") {
      await this.assertHeroServiceCapacity(user, 1);
    }
    const row = await this.prisma.cmsContent.create({
      data: {
        type: dto.type,
        slug,
        title: String(dto.title).trim(),
        summary: dto.summary || null,
        body: dto.body || "",
        coverUrl: dto.coverUrl || null,
        meta: dto.meta || {},
        status,
        publishedAt: status === "published" ? new Date() : null,
        authorName: dto.authorName || null,
        sortOrder: Number(dto.sortOrder) || 0,
        branchId: dto.branchId || user.branchId || null,
        createdBy: user.id,
      },
    });
    await this.audit(user.id, "cms.content.create", "CmsContent", row.id, row);
    return row;
  }

  async updateContent(id: string, dto: any, user: AuthedUser) {
    const c = await this.prisma.cmsContent.findFirst({ where: { id, deletedAt: null, ...this.branchFilter(user) } });
    if (!c) throw new NotFoundException("Content not found");
    const nextStatus = dto.status === "published" || dto.status === "draft" || dto.status === "archived" ? dto.status : c.status;
    if (c.type === "hero_service" && nextStatus === "published" && c.status !== "published") {
      await this.assertHeroServiceCapacity(user, 1);
    }
    const data: any = {
      title: dto.title !== undefined ? String(dto.title).trim() : undefined,
      summary: dto.summary !== undefined ? dto.summary || null : undefined,
      body: dto.body !== undefined ? String(dto.body) : undefined,
      coverUrl: dto.coverUrl !== undefined ? dto.coverUrl || null : undefined,
      meta: dto.meta !== undefined ? dto.meta || {} : undefined,
      sortOrder: dto.sortOrder !== undefined ? Number(dto.sortOrder) || 0 : undefined,
      status: nextStatus,
      publishedAt: nextStatus === "published" ? c.publishedAt || new Date() : nextStatus === "draft" || nextStatus === "archived" ? null : undefined,
    };
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
    const row = await this.prisma.cmsContent.update({ where: { id }, data });
    await this.audit(user.id, "cms.content.update", "CmsContent", id, row);
    return row;
  }

  async publishContent(id: string, user: AuthedUser) {
    const c = await this.prisma.cmsContent.findFirst({ where: { id, deletedAt: null, ...this.branchFilter(user) } });
    if (!c) throw new NotFoundException("Content not found");
    if (c.type === "hero_service" && c.status !== "published") {
      await this.assertHeroServiceCapacity(user, 1);
    }
    const row = await this.prisma.cmsContent.update({
      where: { id },
      data: { status: "published", publishedAt: new Date() },
    });
    await this.audit(user.id, "cms.content.publish", "CmsContent", id, row);
    return row;
  }

  async unpublishContent(id: string, user: AuthedUser) {
    const c = await this.prisma.cmsContent.findFirst({ where: { id, deletedAt: null, ...this.branchFilter(user) } });
    if (!c) throw new NotFoundException("Content not found");
    const row = await this.prisma.cmsContent.update({
      where: { id },
      data: { status: "draft", publishedAt: null },
    });
    await this.audit(user.id, "cms.content.unpublish", "CmsContent", id, row);
    return row;
  }

  private async assertHeroServiceCapacity(user: AuthedUser, adding: number) {
    const count = await this.prisma.cmsContent.count({
      where: { deletedAt: null, type: "hero_service", status: "published", ...this.branchFilter(user) },
    });
    if (count + adding > HERO_SERVICE_MAX) {
      throw new BadRequestException(`Maximum ${HERO_SERVICE_MAX} enabled hero services`);
    }
  }

  // ---------- Travel offers ----------
  listTravel(q: any, user: AuthedUser) {
    const where: any = { deletedAt: null, ...this.branchFilter(user) };
    if (q.serviceType) where.serviceType = q.serviceType;
    if (q.status) where.status = q.status;
    return this.prisma.cmsTravelOffer.findMany({ where, orderBy: { sortOrder: "asc" }, take: 200 });
  }

  async createTravel(dto: any, user: AuthedUser) {
    if (!dto?.serviceType || !TRAVEL_TYPES.has(dto.serviceType)) throw new BadRequestException("Invalid serviceType");
    if (!dto?.title?.trim()) throw new BadRequestException("title required");
    const slug = this.slugify(dto.slug || dto.title);
    const status = dto.status === "published" ? "published" : "draft";
    const row = await this.prisma.cmsTravelOffer.create({
      data: {
        serviceType: dto.serviceType,
        slug,
        title: String(dto.title).trim(),
        summary: dto.summary || null,
        body: dto.body || "",
        coverUrl: dto.coverUrl || null,
        priceFromPoisha: dto.priceFromPoisha != null ? Number(dto.priceFromPoisha) : null,
        currencyCode: dto.currencyCode || "BDT",
        destination: dto.destination || null,
        highlights: dto.highlights || [],
        status,
        publishedAt: status === "published" ? new Date() : null,
        seoTitle: dto.seoTitle || null,
        seoDescription: dto.seoDescription || null,
        sortOrder: Number(dto.sortOrder) || 0,
        branchId: dto.branchId || user.branchId || null,
        createdBy: user.id,
      },
    });
    await this.audit(user.id, "cms.travel.create", "CmsTravelOffer", row.id, row);
    return row;
  }

  // ---------- Forms (admin) ----------
  listForms(q: any, user: AuthedUser) {
    const where: any = { ...this.branchFilter(user) };
    if (q.formType) where.formType = q.formType;
    if (q.status) where.status = q.status;
    return this.prisma.cmsFormSubmission.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 });
  }

  // ---------- Reports ----------
  async reports(user: AuthedUser) {
    const bf = this.branchFilter(user);
    const [pageViews, formsByType, leadsFromForms, publishedPages, publishedContent] = await Promise.all([
      this.prisma.cmsPageView.groupBy({
        by: ["path"],
        where: { ...(bf.branchId ? { branchId: bf.branchId } : {}) },
        _count: { _all: true },
        orderBy: { _count: { path: "desc" } },
        take: 50,
      }),
      this.prisma.cmsFormSubmission.groupBy({
        by: ["formType"],
        where: bf,
        _count: { _all: true },
      }),
      this.prisma.cmsFormSubmission.count({ where: { ...bf, leadId: { not: null } } }),
      this.prisma.cmsPage.count({ where: { deletedAt: null, status: "published", ...bf } }),
      this.prisma.cmsContent.count({ where: { deletedAt: null, status: "published", ...bf } }),
    ]);
    const byPageSlug = await this.prisma.cmsFormSubmission.groupBy({
      by: ["pageSlug"],
      where: { ...bf, pageSlug: { not: null } },
      _count: { _all: true },
    });
    return {
      pageViews: pageViews.map((r) => ({ path: r.path, count: r._count._all })),
      formSubmissions: formsByType.map((r) => ({ formType: r.formType, count: r._count._all })),
      leadGenerationByPage: byPageSlug.map((r) => ({ pageSlug: r.pageSlug || "unknown", count: r._count._all })),
      publishing: { publishedPages, publishedContent, leadsFromForms },
    };
  }

  // ---------- Public site ----------
  async publicPage(slug: string, meta?: { referrer?: string; ua?: string; branchId?: string }) {
    const redirect = await this.prisma.cmsRedirect.findFirst({ where: { fromPath: `/p/${slug}`, isActive: true } });
    if (redirect) return { redirect: { to: redirect.toPath, statusCode: redirect.statusCode } };
    const page = await this.prisma.cmsPage.findFirst({
      where: { slug, deletedAt: null, published: true, status: "published" },
    });
    if (!page) throw new NotFoundException("Page not found");
    await this.prisma.cmsPageView.create({
      data: {
        pageId: page.id,
        path: `/site/p/${slug}`,
        branchId: page.branchId,
        referrer: meta?.referrer || null,
        userAgent: meta?.ua || null,
      },
    });
    return {
      page: {
        slug: page.slug,
        title: page.title,
        body: page.body,
        blocks: page.blocks,
        branchId: page.branchId,
        seo: {
          title: page.seoTitle || page.title,
          description: page.seoDescription,
          keywords: page.seoKeywords,
          canonicalUrl: page.canonicalUrl || `/site/p/${page.slug}`,
          ogImage: page.ogImage,
          structuredData: page.structuredData,
        },
      },
    };
  }

  publicMenu(code: string) {
    return this.prisma.cmsMenu.findFirst({
      where: { code, isActive: true },
      include: { items: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
    });
  }

  publicBanners(placement?: string) {
    const now = new Date();
    return this.prisma.cmsBanner.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        ...(placement ? { placement } : {}),
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { sortOrder: "asc" },
      take: 20,
    });
  }

  publicContent(type?: string) {
    const take = type === "hero_service" ? HERO_SERVICE_MAX : 50;
    return this.prisma.cmsContent.findMany({
      where: { deletedAt: null, status: "published", ...(type ? { type } : {}) },
      orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
      take,
    });
  }

  publicTravel(serviceType?: string) {
    return this.prisma.cmsTravelOffer.findMany({
      where: { deletedAt: null, status: "published", ...(serviceType ? { serviceType } : {}) },
      orderBy: { sortOrder: "asc" },
      take: 100,
    });
  }

  async search(q: string) {
    const term = String(q || "").trim();
    if (term.length < 2) throw new BadRequestException("Query too short");
    const [pages, content, travel] = await Promise.all([
      this.prisma.cmsPage.findMany({
        where: {
          deletedAt: null,
          published: true,
          OR: [{ title: { contains: term, mode: "insensitive" } }, { body: { contains: term, mode: "insensitive" } }],
        },
        take: 20,
        select: { slug: true, title: true, seoDescription: true },
      }),
      this.prisma.cmsContent.findMany({
        where: {
          deletedAt: null,
          status: "published",
          OR: [{ title: { contains: term, mode: "insensitive" } }, { summary: { contains: term, mode: "insensitive" } }],
        },
        take: 20,
        select: { type: true, slug: true, title: true, summary: true },
      }),
      this.prisma.cmsTravelOffer.findMany({
        where: {
          deletedAt: null,
          status: "published",
          OR: [
            { title: { contains: term, mode: "insensitive" } },
            { destination: { contains: term, mode: "insensitive" } },
            { summary: { contains: term, mode: "insensitive" } },
          ],
        },
        take: 20,
        select: { serviceType: true, slug: true, title: true, destination: true, priceFromPoisha: true },
      }),
    ]);
    return {
      query: term,
      pages: pages.map((p) => ({ kind: "page", ...p })),
      content: content.map((c) => ({ kind: "content", ...c })),
      packages: travel.map((t) => ({ kind: "package", ...t })),
      services: travel.map((t) => ({ kind: "service", serviceType: t.serviceType, title: t.title, slug: t.slug })),
    };
  }

  async submitForm(dto: any, ip: string) {
    if (!dto?.formType || !FORM_TYPES.has(dto.formType)) throw new BadRequestException("Invalid formType");
    if (!dto?.name?.trim()) throw new BadRequestException("name required");
    const formType = String(dto.formType);
    const name = String(dto.name).trim().slice(0, 100);
    const phone = dto.phone ? String(dto.phone).trim().slice(0, 20) : null;
    const email = dto.email ? String(dto.email).trim().slice(0, 120) : null;
    const message = dto.message ? String(dto.message).trim().slice(0, 4000) : null;
    const pageSlug = dto.pageSlug ? String(dto.pageSlug).trim() : null;
    const branchId = dto.branchId || (await this.prisma.branch.findFirst({ where: { type: "corporate" } }))?.id || null;

    let leadId: string | null = null;
    if (LEAD_FORMS.has(formType)) {
      const interest =
        formType === "visa"
          ? "visa"
          : formType === "tour"
            ? "tour"
            : formType === "hajj"
              ? "hajj"
              : formType === "quote"
                ? String(dto.serviceInterest || "visa")
                : String(dto.serviceInterest || "visa");
      const leadNo = `LD-WEB-${Date.now().toString().slice(-8)}`;
      const lead = await this.prisma.lead.create({
        data: {
          leadNo,
          name,
          phone,
          email,
          source: "web",
          serviceInterest: interest,
          status: "new_lead",
          priority: "warm",
          notes: message,
          branchId,
          createdBy: "site-form",
        },
      });
      leadId = lead.id;
    }

    const sub = await this.prisma.cmsFormSubmission.create({
      data: {
        formType,
        name,
        email,
        phone,
        message,
        payload: { ...dto, ip },
        pageSlug,
        leadId,
        branchId,
        status: "new",
      },
    });

    const staff = await this.prisma.user.findMany({
      where: { status: "active", deletedAt: null, role: { name: { in: ["super_admin", "general_manager", "marketing_manager", "office_incharge"] } } },
      select: { id: true },
    });
    await this.notes.enqueueMany(
      staff.map((u) => ({ channel: "inapp", recipient: u.id })),
      {
        subject: `Website ${formType} form`,
        body: `${name}${phone ? " · " + phone : ""}${leadId ? " · lead created" : ""}`,
        relatedType: "CmsFormSubmission",
        relatedId: sub.id,
      },
    );

    return { ok: true, submissionId: sub.id, leadId };
  }

  async sitemapXml() {
    const base = process.env.PUBLIC_SITE_URL || "https://shanghaitravels.com.bd";
    const pages = await this.prisma.cmsPage.findMany({
      where: { deletedAt: null, published: true },
      select: { slug: true, updatedAt: true },
    });
    const offers = await this.prisma.cmsTravelOffer.findMany({
      where: { deletedAt: null, status: "published" },
      select: { serviceType: true, slug: true, updatedAt: true },
    });
    const urls = [
      ...pages.map((p) => ({ loc: `${base}/#/site/p/${p.slug}`, lastmod: p.updatedAt.toISOString() })),
      ...offers.map((o) => ({ loc: `${base}/#/site/travel/${o.serviceType}/${o.slug}`, lastmod: o.updatedAt.toISOString() })),
    ];
    const body =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join("\n") +
      `\n</urlset>\n`;
    return body;
  }

  robotsTxt() {
    const base = process.env.PUBLIC_SITE_URL || "https://shanghaitravels.com.bd";
    return `User-agent: *\nAllow: /\nSitemap: ${base}/api2/site/sitemap.xml\n`;
  }
}
