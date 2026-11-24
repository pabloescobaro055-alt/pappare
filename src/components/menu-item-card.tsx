"use client";

import { useRef, useState } from "react";
import Image from "next/image";

import { Search, X } from "lucide-react";

import type { MenuItem } from "@/data/menu";
import type { MenuDishPhoto } from "@/data/menu-photos";
import { cn } from "@/lib/utils";

type MenuItemCardProps = {
  item: MenuItem;
  imageSrc?: string;
  photos?: MenuDishPhoto[];
};

export function MenuItemCard({ item, imageSrc: fallbackImage, photos = [] }: MenuItemCardProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const photo = photos[photoIndex];
  const imageSrc = photo?.src || fallbackImage;
  const photoLabel = photo?.label || item.name;



  return (
    <>
      <article
        className={cn(
          "menu-item-card rounded-2xl border border-current/15 bg-cream p-4 md:p-5",
          imageSrc && "grid gap-4 sm:grid-cols-[112px_1fr] sm:items-start",
        )}
      >
        <div className={cn("flex items-start justify-between gap-4", imageSrc && "sm:col-start-2")}>
          <h4 className="menu-item-title font-display text-2xl font-semibold leading-tight">
            {item.name}
          </h4>
          <p className="menu-item-price shrink-0 text-lg font-semibold text-walnut">
            {item.price}
          </p>
        </div>

        {imageSrc && (
          <button
            type="button"
            aria-label={`Открыть фото ${photoLabel}`}
            onClick={() => dialogRef.current?.showModal()}
            className={cn("menu-item-image group relative w-full cursor-zoom-in overflow-hidden rounded-xl bg-linen sm:col-start-1 sm:row-span-3 sm:row-start-1 sm:h-[112px] sm:w-[112px] sm:shrink-0",photo?.aspect==='square'?'aspect-square':'h-44')}
          >
            <Image
              src={imageSrc}
              alt={photoLabel}
              fill
              sizes="(max-width: 640px) 100vw, 112px"
              loading="lazy"
              decoding="async"
              className={cn("transition duration-300 group-hover:scale-[1.04] group-hover:brightness-105",photo?.aspect==='square'?'object-contain':'object-cover')}
            />
            <span className="absolute inset-0 flex items-center justify-center bg-ink/0 opacity-0 transition duration-[250ms] group-hover:bg-ink/28 group-hover:opacity-100">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cream/88 text-ink shadow-soft backdrop-blur">
                <Search size={19} strokeWidth={1.8} />
              </span>
            </span>
          </button>
        )}

        {photos.length > 1 && (
          <div className="flex flex-wrap gap-2 sm:col-start-2" aria-label={`Варианты фото: ${item.name}`}>
            {photos.map((variant, index) => (
              <button key={variant.src} type="button" aria-pressed={photoIndex === index}
                onClick={() => setPhotoIndex(index)}
                className={cn("rounded-full border px-3 py-1 text-xs", photoIndex === index ? "border-clay text-clay" : "border-walnut/20 text-ink/70")}>
                {variant.label}
              </button>
            ))}
          </div>
        )}

        {photo?.caption && <p className="text-xs text-ink/60 sm:col-start-2">{photo.caption}</p>}

        {item.description && <p className={cn("menu-item-description text-sm leading-6 text-ink/62", imageSrc ? "sm:col-start-2" : "mt-2 md:mt-3")}>
          {item.description}
        </p>}
        {item.weight && <p className={cn("menu-item-weight text-sm font-medium text-ink/48", imageSrc ? "sm:col-start-2" : "mt-3 md:mt-4")}>
          {item.weight}
        </p>}
      </article>

      {imageSrc && (
        <dialog ref={dialogRef} aria-label={photoLabel}
          className="pappare-dish-dialog relative max-h-none max-w-none overflow-visible bg-transparent"
          onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
          <button type="button" aria-label="Закрыть фото" onClick={() => dialogRef.current?.close()}
            className="absolute right-2 top-2 z-10 grid h-11 w-11 place-items-center rounded-full bg-ink text-cream">
            <X size={24} />
          </button>
          <div className="relative h-[82dvh] w-[90vw]" onClick={() => dialogRef.current?.close()}>
            <Image src={imageSrc} alt={photoLabel} fill sizes="90vw" loading="lazy" className="object-contain" />
          </div>
        </dialog>
      )}
    </>
  );
}
