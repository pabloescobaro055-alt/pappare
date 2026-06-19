import Link from "next/link";
import { Clock, MapPin, Phone } from "lucide-react";

import { SocialLinks } from "@/components/social-links";
import { contactInfo } from "@/data/site";

export function Footer() {
  return (
    <footer className="bg-ink py-9 text-cream md:py-12">
      <div className="container">
        <div className="grid gap-6 md:grid-cols-[1fr_1.2fr_0.8fr] md:gap-8">
          <div>
            <p className="font-display text-3xl font-semibold">Pappare Italiano</p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-cream/62">
              Современная итальянская траттория в Иркутске для теплых встреч,
              ужинов и спокойных вечеров.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-cream/72">
            <p className="flex items-center gap-3">
              <MapPin className="text-amber" size={18} />
              {contactInfo.address}
            </p>
            <p className="flex items-center gap-3">
              <Clock className="text-amber" size={18} />
              {contactInfo.hours}
            </p>
            <Link className="flex items-center gap-3 transition hover:text-amber" href={contactInfo.phoneHref}>
              <Phone className="text-amber" size={18} />
              {contactInfo.phone}
            </Link>
          </div>
          <div className="md:justify-self-end">
            <SocialLinks light />
          </div>
        </div>

        <div className="mt-8 border-t border-cream/10 pt-5 text-xs leading-5 text-cream/42 md:mt-10">
          <p>Индивидуальный предприниматель Ашуров Д.Д.</p>
          <p>ИНН: 381210419046 · ОГРНИП: 322385000095005</p>
        </div>
      </div>
    </footer>
  );
}
