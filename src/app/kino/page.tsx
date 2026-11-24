import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { EventCard } from "@/components/cinema/event-card";
import { Button } from "@/components/ui/button";
import { cinemaCopy, isPast } from "@/data/cinema";
import { contactInfo } from "@/data/site";
import { loadEvents } from "@/lib/cinema/events";

export const dynamic = "force-dynamic";

export default async function CinemaLanding() {
  const events = await loadEvents();
  const upcoming = events.filter((event) => !isPast(event));
  const past = events.filter((event) => isPast(event));

  return (
    <main>
      <section className="cinema-container cinema-showcase">
        <div>
          <h1>Киноужины<br />в Pappare</h1>
          <p>{cinemaCopy.intro}</p>
          <Button asChild variant="warm">
            <a href="#evenings">Посмотреть афишу <ArrowUpRight size={18} /></a>
          </Button>
        </div>
        <div className="cinema-showcase-image">
          <Image src="/assets/pappare-cinema-evening-v2.png" alt="Зал Pappare во время киноужина"
            fill priority sizes="(max-width: 760px) 100vw, 55vw" className="object-cover" />
        </div>
      </section>

      <section className="cinema-container evenings" id="evenings">
        <h2>Ближайшие киноужины</h2>
        {upcoming.length ? (
          <div className="event-grid">{upcoming.map((event) => <EventCard key={event.id} event={event} />)}</div>
        ) : (
          <p className="cinema-empty">Следующие показы пока не объявлены.</p>
        )}
        {past.length > 0 && (
          <>
            <h2 className="soon-title">Прошедшие киноужины</h2>
            <div className="event-grid">{past.map((event) => <EventCard key={event.id} event={event} />)}</div>
          </>
        )}
      </section>
      <aside className="cinema-container cinema-visit">
        <p>Третье место за столом можно согласовать с администратором.</p>
        <a href={contactInfo.phoneHref}>{contactInfo.phone}</a>
        <Link href="/kino/terms">Условия бронирования</Link>
      </aside>
    </main>
  );
}
