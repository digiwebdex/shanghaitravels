import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { CoverImage } from "./CoverImage";
import { Section, SectionHeading, ViewAll } from "./Section";
import type { CmsContent } from "./api";
import { CARD, CARD_HOVER, FOCUS } from "./tokens";

type BlogLatestProps = {
  posts: CmsContent[];
};

function splitDate(iso?: string | null): { day: string; month: string } | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return {
    day: String(date.getDate()).padStart(2, "0"),
    month: date.toLocaleDateString("en-GB", { month: "short" }).toUpperCase(),
  };
}

export function BlogLatest({ posts }: BlogLatestProps) {
  const published = posts
    .filter((p) => p.status !== "draft")
    .slice()
    .sort((a, b) => {
      const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return db - da;
    })
    .slice(0, 4);

  if (!published.length) return null;

  return (
    <Section id="blog">
      <SectionHeading title="Latest from Blog" action={<ViewAll to="/blog">View all articles</ViewAll>} />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {published.map((post) => {
          const date = splitDate(post.publishedAt);

          return (
            <article key={post.id} className={`group flex h-full flex-col overflow-hidden ${CARD} ${CARD_HOVER}`}>
              <Link to={`/blog/${post.slug}`} className={`flex h-full flex-col ${FOCUS}`}>
                <div className="relative h-[112px] shrink-0 overflow-hidden bg-muted">
                  <CoverImage
                    src={post.coverUrl}
                    className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.07]"
                  />

                  {date && (
                    <span className="absolute bottom-3 left-3 grid size-[46px] place-items-center rounded-lg bg-white shadow-[0_4px_14px_rgba(20,33,61,0.18)]">
                      <span className="block text-[15px] font-extrabold leading-none text-primary">{date.day}</span>
                      <span className="mt-0.5 block text-[8px] font-bold tracking-wide text-accent">
                        {date.month}
                      </span>
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 text-[13.5px] font-bold text-primary transition-colors group-hover:text-accent">
                    {post.title}
                  </h3>
                  {post.summary && (
                    <p className="mt-1.5 line-clamp-2 text-[11px] leading-[1.55] text-muted-foreground">
                      {post.summary}
                    </p>
                  )}
                  <span className="mt-auto inline-flex items-center gap-1 pt-3 text-[11px] font-bold text-accent transition-all group-hover:gap-2">
                    Read More
                    <ArrowRight size={11} aria-hidden />
                  </span>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
