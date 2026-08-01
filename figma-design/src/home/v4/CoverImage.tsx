import { useEffect, useState } from "react";
import { PHOTO_GRADE } from "./tokens";

type CoverImageProps = {
  src?: string | null;
  /** Curated frame used when `src` is missing or fails to load. */
  fallbackSrc?: string | null;
  className?: string;
  /** Rendered only when both sources fail. */
  fallbackClassName?: string;
  eager?: boolean;
};

/**
 * Photo slot with a two-step fallback. Several CMS records point at retired
 * stock URLs, so an onError path that lands on real photography rather than a
 * gradient is what keeps those cards looking finished.
 */
export function CoverImage({
  src,
  fallbackSrc,
  className = "",
  fallbackClassName = "size-full bg-gradient-to-br from-primary/70 to-primary",
  eager = false,
}: CoverImageProps) {
  const sources = [src, fallbackSrc].filter((s): s is string => Boolean(s));
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setAttempt(0);
    setLoaded(false);
  }, [src, fallbackSrc]);

  const current = sources[attempt];
  if (!current) return <div className={fallbackClassName} aria-hidden />;

  return (
    <img
      src={current}
      alt=""
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => {
        setLoaded(false);
        setAttempt((n) => n + 1);
      }}
      className={`${className} ${PHOTO_GRADE} transition-opacity duration-700 ${
        loaded ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}
