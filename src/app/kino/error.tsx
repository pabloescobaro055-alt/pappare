'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="order-page">
      <h1>Не удалось загрузить страницу</h1>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        <Button variant="warm" onClick={reset}>Попробовать ещё раз</Button>
        <Link className="underline underline-offset-4" href="/kino">К афише</Link>
      </div>
    </main>
  );
}
