"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
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
  const [isOpen, setIsOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const photo = photos[photoIndex];
  const imageSrc = photo?.src || fallbackImage;
  const photoLabel = photo?.label || item.name;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <article
        className={cn(
          "menu-item-card rounded-lg bg-cream p-4 md:p-5",
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
            onClick={() => setIsOpen(true)}
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

        <p className={cn("menu-item-description text-sm leading-6 text-ink/62 md:min-h-12", imageSrc ? "sm:col-start-2" : "mt-2 md:mt-3")}>
          {item.description}
        </p>
        <p className={cn("menu-item-weight text-sm font-medium text-ink/48", imageSrc ? "sm:col-start-2" : "mt-3 md:mt-4")}>
          {item.weight}
        </p>
      </article>

      <AnimatePresence>
        {isOpen && imageSrc && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/86 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <button
              type="button"
              aria-label="Закрыть фото"
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-cream/25 bg-cream/12 text-cream backdrop-blur transition hover:bg-cream/22 md:right-8 md:top-8"
            >
              <X size={24} strokeWidth={1.8} />
            </button>
            <motion.div
              className="relative h-[90vh] w-[90vw]"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image
                src={imageSrc}
                alt={photoLabel}
                fill
                sizes="90vw"
                decoding="async"
                className="object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
