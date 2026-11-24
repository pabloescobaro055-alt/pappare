import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="theme-page min-h-screen bg-cream text-ink">
      <SiteNav />
      <section className="container py-16 md:py-24">
        <h1 className="font-display text-5xl font-semibold md:text-7xl">Страница не найдена</h1>
        <p className="mt-4 max-w-lg leading-7">Вернитесь на главную или откройте меню Pappare.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="warm"><Link href="/">На главную</Link></Button>
          <Button asChild><Link href="/menu">Открыть меню</Link></Button>
        </div>
      </section>
    </main>
  );
}
