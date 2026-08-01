import { useEffect, useState } from "react";

type CoverImageProps = {
  src?: string | null;
  className?: string;
  /** Rendered instead of the image when the source is missing or fails to load. */
  fallbackClassName?: string;
};

/** Photo slot that degrades to the brand gradient rather than a broken-image box. */
export function CoverImage({
  src,
  className = "",
  fallbackClassName = "size-full bg-gradient-to-br from-primary/70 to-primary",
}: CoverImageProps) {
  const [broken, setBroken] = useState(false);

  useEffect(() => setBroken(false), [src]);

  if (!src || broken) return <div className={fallbackClassName} aria-hidden />;

  return (
    <img src={src} alt="" loading="lazy" className={className} onError={() => setBroken(true)} />
  );
}
