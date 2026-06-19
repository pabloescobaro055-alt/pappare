import Link from "next/link";

import { JsonLd } from "@/components/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

export function Breadcrumbs({
  items,
}: {
  items: Array<{ name: string; href: string }>;
}) {
  return (
    <>
      <nav aria-label="Хлебные крошки" className="container pt-20 text-sm text-ink/60 md:pt-24">
        <ol className="flex flex-wrap items-center gap-2">
          {items.map((item, index) => (
            <li key={item.href} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {index === items.length - 1 ? (
                <span className="text-ink">{item.name}</span>
              ) : (
                <Link className="transition hover:text-clay" href={item.href}>
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(items)} />
    </>
  );
}
