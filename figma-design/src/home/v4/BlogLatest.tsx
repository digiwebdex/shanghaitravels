import { Link } from "react-router";
import { ArrowRight, Calendar } from "lucide-react";
import { Section, SectionHeader } from "./Section";
import type { CmsContent } from "./api";

type BlogLatestProps = {
  posts: CmsContent[];
};

function formatDate(iso?: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-BD", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function BlogLatest({ posts }: BlogLatestProps) {
  const published = posts
    .filter((p) => p.status !== "draft")
    .sort((a, b) => {
      const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return db - da;
    })
    .slice(0, 3);

  if (!published.length) return null;

  return (
    <Section className="py-16 md:py-24 bg-white">
      <SectionHeader
        eyebrow="From Our Blog"
        title="Travel Tips & Updates"
        subtitle="Visa news, destination guides and pilgrimage advice from our Dhaka team."
        action={
          <Link
            to="/blog"
            className="hidden md:inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-accent transition-colors"
          >
            View all articles <ArrowRight size={14} />
          </Link>
        }
      />

      <div className="grid md:grid-cols-3 gap-6">
        {published.map((post) => (
          <article
            key={post.id}
            className="group bg-card rounded-2xl border border-border overflow-hidden shadow-[0_8px_30px_rgba(20,33,61,0.06)] hover:shadow-lg transition-all"
          >
            <Link to={`/blog/${post.slug}`} className="block">
              <div className="relative h-44 overflow-hidden bg-muted">
                {post.coverUrl ? (
                  <img
                    src={post.coverUrl}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/70 to-primary" />
                )}
              </div>
              <div className="p-5">
                {post.publishedAt && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mb-2">
                    <Calendar size={11} />
                    {formatDate(post.publishedAt)}
                  </p>
                )}
                <h3 className="font-bold text-foreground mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                  {post.title}
                </h3>
                {post.summary && (
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{post.summary}</p>
                )}
              </div>
            </Link>
          </article>
        ))}
      </div>
    </Section>
  );
}
