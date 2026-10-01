"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMood } from "@/components/theme-provider";

export function SiteNav({ dark = false }: { dark?: boolean }) {
  const { mood } = useMood();
  const isDark = dark || mood === "night";
  const text = isDark ? "text-cream" : "text-ink";
  const muted = isDark ? "text-cream/82" : "text-ink/72";

  return (
    <header className={`absolute inset-x-0 top-0 z-30 ${text}`}>
      <div className="container flex h-20 items-center justify-between">
        <Link href="/" className="font-display text-2xl font-semibold tracking-wide">
          Pappare
        </Link>
        <nav className={`hidden items-center gap-7 text-sm ${muted} md:flex`}>
          <Link href={`/menu?mode=${mood}`}>Меню</Link>
          <Link href="/interior">Интерьер</Link>
          <Link href="/contacts">Контакты</Link>
        </nav>
        <Button asChild variant={isDark ? "outline" : "default"} className="hidden md:inline-flex">
          <Link href="/contacts#reservation">
            <CalendarDays size={18} />
            Забронировать
          </Link>
        </Button>
      </div>
    </header>
  );
}


