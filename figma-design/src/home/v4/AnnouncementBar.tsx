import { Phone, Mail, Shield, Facebook, Instagram, Youtube } from "lucide-react";

const HOTLINE = "+880 1333-356393";
const EMAIL = "info@shanghaitravels.com.bd";

export function AnnouncementBar() {
  return (
    <div className="bg-primary text-white/80 text-xs">
      <div className="max-w-[1440px] mx-auto px-6 md:px-8 py-2 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-1">
          <span className="inline-flex items-center gap-1.5 font-semibold text-white">
            <Shield size={12} className="text-accent shrink-0" />
            Government Approved · Reg. No. 0017053
          </span>
          <a href={`tel:${HOTLINE.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
            <Phone size={11} className="text-accent shrink-0" />
            {HOTLINE}
          </a>
          <a href={`mailto:${EMAIL}`} className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
            <Mail size={11} className="text-accent shrink-0" />
            {EMAIL}
          </a>
        </div>
        <div className="flex items-center gap-3">
          {[
            { Icon: Facebook, href: "https://facebook.com", label: "Facebook" },
            { Icon: Instagram, href: "https://instagram.com", label: "Instagram" },
            { Icon: Youtube, href: "https://youtube.com", label: "YouTube" },
          ].map(({ Icon, href, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="size-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 hover:text-white transition-colors"
            >
              <Icon size={13} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
