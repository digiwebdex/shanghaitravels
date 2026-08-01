import logoUrl from "../../assets/logo.png";

type LogoProps = {
  className?: string;
  /** Adds a soft halo so the blue wordmark stays legible on the navy footer. */
  onDark?: boolean;
};

export function Logo({ className = "h-12", onDark }: LogoProps) {
  return (
    <img
      src={logoUrl}
      alt="Shanghai Travels"
      width={819}
      height={420}
      className={`${className} w-auto object-contain ${
        onDark ? "drop-shadow-[0_0_14px_rgba(255,255,255,0.28)]" : ""
      }`}
    />
  );
}
