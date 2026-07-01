"use client";

import {
  Children,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { motion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type PremiumCarouselProps = {
  children: ReactNode;
  ariaLabel: string;
  autoPlayMs?: number;
  className?: string;
  slideClassName?: string;
};

const RESUME_DELAY_MS = 10000;
const SWIPE_DISTANCE = 64;
const SWIPE_VELOCITY = 420;

export function PremiumCarousel({
  children,
  ariaLabel,
  autoPlayMs = 5600,
  className,
  slideClassName,
}: PremiumCarouselProps) {
  const slides = Children.toArray(children);
  const count = slides.length;
  const loopedSlides = count > 1 ? [slides[count - 1], ...slides, slides[0]] : slides;
  const [position, setPosition] = useState(count > 1 ? 1 : 0);
  const [targetX, setTargetX] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [pausedUntil, setPausedUntil] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const active = count > 1 ? (position - 1 + count) % count : 0;

  const measure = () => {
    const viewport = viewportRef.current;
    const slide = slideRefs.current[position];
    if (!viewport || !slide) {
      return;
    }

    const viewportCenter = viewport.clientWidth / 2;
    const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
    setTargetX(viewportCenter - slideCenter);
  };

  useLayoutEffect(() => {
    measure();

    const viewport = viewportRef.current;
    if (!viewport || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    slideRefs.current.forEach((slide) => {
      if (slide) {
        observer.observe(slide);
      }
    });

    return () => observer.disconnect();
  }, [count, position]);

  useEffect(() => {
    if (!isJumping) {
      return;
    }

    const frame = window.requestAnimationFrame(() => setIsJumping(false));
    return () => window.cancelAnimationFrame(frame);
  }, [isJumping, position]);

  useEffect(() => {
    if (count <= 1 || isHovering || isDragging) {
      return;
    }

    const now = Date.now();
    if (pausedUntil > now) {
      const resumeTimer = window.setTimeout(() => setPausedUntil(0), pausedUntil - now);
      return () => window.clearTimeout(resumeTimer);
    }

    const timer = window.setTimeout(() => {
      setPosition((current) => current + 1);
    }, autoPlayMs);

    return () => window.clearTimeout(timer);
  }, [autoPlayMs, count, isDragging, isHovering, pausedUntil, position]);

  const pauseAfterInteraction = () => {
    setPausedUntil(Date.now() + RESUME_DELAY_MS);
  };

  const goTo = (index: number, userInitiated = true) => {
    if (count <= 1) {
      return;
    }

    if (userInitiated) {
      pauseAfterInteraction();
    }

    setPosition(((index + count) % count) + 1);
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    pauseAfterInteraction();

    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) {
      setPosition((current) => current + 1);
      return;
    }

    if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY) {
      setPosition((current) => current - 1);
    }
  };

  const handleAnimationComplete = () => {
    if (count <= 1) {
      return;
    }

    if (position === 0) {
      setIsJumping(true);
      setPosition(count);
      return;
    }

    if (position === count + 1) {
      setIsJumping(true);
      setPosition(1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className={cn("group relative", className)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setIsDragging(false);
      }}
    >
      <div
        ref={viewportRef}
        aria-label={ariaLabel}
        className={cn(
          "overflow-hidden py-3 select-none",
          isDragging ? "select-none cursor-grabbing" : count > 1 ? "cursor-grab" : "cursor-default",
        )}
      >
        <motion.div
          className="flex touch-pan-y gap-4 md:gap-6"
          animate={{ x: targetX }}
          transition={
            isJumping
              ? { duration: 0 }
              : { type: "spring", stiffness: 92, damping: 24, mass: 1.05 }
          }
          drag={count > 1 ? "x" : false}
          dragElastic={0.12}
          dragMomentum={false}
          onAnimationComplete={handleAnimationComplete}
          onDragStart={() => {
            setIsDragging(true);
            pauseAfterInteraction();
          }}
          onDragEnd={handleDragEnd}
          style={{ userSelect: isDragging ? "none" : undefined }}
        >
          {loopedSlides.map((slide, index) => {
            const distance = Math.abs(index - position);
            const isActive = index === position;

            return (
              <motion.div
                key={index}
                ref={(node) => {
                  slideRefs.current[index] = node;
                }}
                className={cn(
                  "min-w-0 shrink-0",
                  "transition-[filter] duration-700",
                  slideClassName ?? "w-[78vw] sm:w-[62vw] md:w-[44vw] lg:w-[36vw]",
                )}
                animate={{
                  scale: isActive ? 1 : distance === 1 ? 0.76 : 0.68,
                  opacity: isActive ? 1 : distance === 1 ? 0.62 : 0.22,
                  y: isActive ? 0 : 16,
                }}
                transition={
                  isJumping
                    ? { duration: 0 }
                    : { duration: 0.78, ease: [0.22, 1, 0.36, 1] }
                }
              >
                <div className="h-full transition duration-500 hover:scale-[1.015]">{slide}</div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Предыдущий слайд"
            onClick={() => goTo(active - 1)}
            className="absolute left-3 top-1/2 z-10 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-cream/40 bg-ink/34 text-cream opacity-0 shadow-soft backdrop-blur-xl transition duration-300 hover:bg-ink/52 hover:scale-105 group-hover:opacity-100 md:flex"
          >
            <ChevronLeft size={28} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            aria-label="Следующий слайд"
            onClick={() => goTo(active + 1)}
            className="absolute right-3 top-1/2 z-10 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-cream/40 bg-ink/34 text-cream opacity-0 shadow-soft backdrop-blur-xl transition duration-300 hover:bg-ink/52 hover:scale-105 group-hover:opacity-100 md:flex"
          >
            <ChevronRight size={28} strokeWidth={1.8} />
          </button>

          <div className="mt-4 flex justify-center gap-2.5" aria-hidden="true">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goTo(index)}
                className={cn(
                  "h-2.5 rounded-full transition-all duration-500 ease-out",
                  active === index
                    ? "w-9 bg-clay shadow-[0_0_18px_rgba(201,106,58,0.28)]"
                    : "w-2.5 bg-ink/18 hover:bg-clay/45",
                )}
              />
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
