import Link from "next/link";
import { Instagram, MessageCircle, Send } from "lucide-react";

import { socialLinks } from "@/data/site";

const icons = {
  telegram: Send,
  instagram: Instagram,
  max: MessageCircle,
};

export function SocialLinks({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {socialLinks
        .filter((link) => link.href)
        .map((link) => {
          const Icon = icons[link.id];
          return (
            <Link
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              aria-label={link.title}
              className={`grid size-11 place-items-center rounded-full border transition ${
                light
                  ? "border-cream/25 text-cream hover:border-amber hover:text-amber"
                  : "border-walnut/20 text-ink hover:border-clay hover:text-clay"
              }`}
            >
              <Icon size={18} />
            </Link>
          );
        })}
    </div>
  );
}
