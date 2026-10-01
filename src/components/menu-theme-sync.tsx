"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useMood } from "@/components/theme-provider";

export function MenuThemeSync() {
  const searchParams = useSearchParams();
  const { setMood } = useMood();
  const mode = searchParams.get("mode");

  useEffect(() => {
    if (mode === "morning" || mode === "day" || mode === "night") {
      setMood(mode);
    }
  }, [mode, setMood]);

  return null;
}
