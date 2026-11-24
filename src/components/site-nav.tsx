"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

const links = [["/menu", "Меню"], ["/#events", "События"], ["/kino", "Киноужин"], ["/interior", "Интерьер"], ["/contacts", "Контакты"]] as const;

export function SiteNav() {
  const pathname = usePathname();
  return (
    <header className="pappare-inner-nav border-b border-current/15">
      <div className="container flex flex-wrap items-center justify-between gap-x-6">
        <Link href="/" className="font-display text-2xl font-semibold tracking-wide">
          Pappare
        </Link>
        <nav aria-label="Основная навигация" className="order-last flex w-full flex-wrap justify-between gap-x-2 text-xs sm:justify-start sm:gap-x-4 sm:text-sm md:order-none md:w-auto lg:gap-x-6">
          {links.map(([href, label]) => (
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>
          ))}
        </nav>
        <Button asChild variant="warm" className="my-2 h-10 px-4">
          <Link href="/contacts#reservation">
            <CalendarDays size={18} />
            Забронировать
          </Link>
        </Button>
      </div>
    </header>
  );
}


