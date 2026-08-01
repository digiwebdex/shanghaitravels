import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { CoverImage } from "./CoverImage";
import { Section, SectionHeading, ViewAll } from "./Section";
import type { CmsContent } from "./api";
import { postFallbackImage } from "./format";
import { CARD, CARD_HOVER, EASE, FOCUS } from "./tokens";

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
        {published.map((post, i) => {
          const date = splitDate(post.publishedAt);

          return (
            <article key={post.id} className={`group flex h-full flex-col overflow-hidden ${CARD} ${CARD_HOVER}`}>
              <Link to={`/blog/${post.slug}`} className={`flex h-full flex-col ${FOCUS}`}>
                <div className="relative h-[112px] shrink-0 overflow-hidden bg-[#E8EDF5]">
                  <CoverImage
                    src={post.coverUrl}
                    fallbackSrc={postFallbackImage(post, i)}
                    className={`size-full object-cover transition-transform duration-[900ms] ${EASE} group-hover:scale-[1.09]`}
                  />

                  <div
                    className="absolute inset-x-0 bottom-0 h-3/5 bg-[linear-gradient(180deg,rgba(20,33,61,0)_0%,rgba(20,33,61,0.38)_100%)]"
                    aria-hidden
                  />

                  {date && (
                    <span
                      className={`absolute bottom-3 left-3 grid size-[46px] place-items-center rounded-lg bg-white shadow-[0_2px_6px_rgba(20,33,61,0.1),0_8px_20px_rgba(20,33,61,0.2)] ring-1 ring-black/[0.04] transition-transform duration-500 ${EASE} group-hover:-translate-y-0.5`}
                    >
                      <span className="block text-[15px] font-extrabold leading-none tracking-[-0.02em] text-primary">
                        {date.day}
                      </span>
                      <span className="mt-1 block text-[8px] font-bold tracking-[0.1em] text-accent">
                        {date.month}
                      </span>
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-[18px]">
                  <h3 className="line-clamp-2 text-[13.5px] font-bold leading-[1.45] tracking-[-0.01em] text-primary transition-colors duration-300 group-hover:text-accent">
                    {post.title}
                  </h3>
                  {post.summary && (
                    <p className="mt-2 line-clamp-2 text-[11px] leading-[1.65] text-muted-foreground">
                      {post.summary}
                    </p>
                  )}
                  <span className="mt-auto inline-flex items-center gap-1 pt-4 text-[11px] font-bold tracking-[0.01em] text-accent transition-all duration-300 group-hover:gap-2">
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
