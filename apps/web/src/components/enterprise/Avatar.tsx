import { useState } from "react";

/** Up to two initials from a person/company name — avatar fallback. */
export function initialsOf(name?: string | null): string {
  const parts = (name || "").split(/\s+/).filter(Boolean);
  const ini = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("");
  return ini || "?";
}

/**
 * Circular avatar shared across enterprise list modules. Shows the photo at
 * `src` when provided (falling back to initials on load error), otherwise a
 * tinted initials chip. Reuses the same look the Agents list uses.
 */
export function Avatar({ name, src }: { name?: string | null; src?: string | null }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
        className="h-8 w-8 rounded-full border border-[var(--border)] object-cover"
      />
    );
  }
  return (
    <span
      className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--navy-50)] text-[10px] font-bold text-[var(--foreground)]"
      title={name || undefined}
    >
      {initialsOf(name)}
    </span>
  );
}
