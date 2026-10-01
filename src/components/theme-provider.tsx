"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Mood = "morning" | "day" | "night";

type ThemeContextValue = {
  mood: Mood;
  setMood: (mood: Mood) => void;
};

const MOOD_STORAGE_KEY = "pappare-mood";
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mood, setMoodState] = useState<Mood>("day");

  useEffect(() => {
    const requestedMood = new URLSearchParams(window.location.search).get("mode");
    const savedMood = window.localStorage.getItem(MOOD_STORAGE_KEY);
    if (requestedMood === "morning" || requestedMood === "day" || requestedMood === "night") {
      setMoodState(requestedMood);
    } else if (savedMood === "morning" || savedMood === "day" || savedMood === "night") {
      setMoodState(savedMood);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.mood = mood;
    window.localStorage.setItem(MOOD_STORAGE_KEY, mood);
  }, [mood]);

  const value = useMemo(
    () => ({
      mood,
      setMood: (nextMood: Mood) => setMoodState(nextMood),
    }),
    [mood],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useMood() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useMood must be used inside ThemeProvider");
  }
  return context;
}
