import { useState, useCallback } from "react";

export interface HistoryEntry {
  id: string;
  query: string;
  ayat: string;
  ayatReference: string;
  bengaliTranslation: string;
  reflection: string;
  hadith: string;
  hadithBengali: string;
  hadithNarrator: string;
  hadithSource: string;
  asmaulHusnaArabic: string;
  asmaulHusnaBengali: string;
  asmaulHusnaExplanation: string;
  isShared: boolean;
  authorId?: string;
  authorName?: string;
  timestamp: number;
}

export type NewEntry = Omit<HistoryEntry, "id" | "timestamp" | "isShared" | "authorId" | "authorName">;

const STORAGE_KEY = "sakinah-reflection-history";
const MAX = 100;

function read(): HistoryEntry[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(raw)
      ? raw.map((e: any) => ({
          hadith: "", asmaulHusnaArabic: "", asmaulHusnaBengali: "", asmaulHusnaExplanation: "",
          ...e, isShared: !!e.isShared,
        }))
      : [];
  } catch {
    return [];
  }
}

function write(entries: HistoryEntry[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX))); } catch { /* storage full */ }
}

/** Private reflection diary, stored only on this device. */
export function useReflectionHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(read);

  const update = useCallback((fn: (prev: HistoryEntry[]) => HistoryEntry[]) => {
    setHistory((prev) => { const next = fn(prev); write(next); return next; });
  }, []);

  const addEntry = useCallback((entry: NewEntry): string => {
    const id = crypto.randomUUID();
    update((prev) => [{ ...entry, id, timestamp: Date.now(), isShared: false }, ...prev]);
    return id;
  }, [update]);

  const setShared = useCallback((id: string, shared: boolean) => {
    update((prev) => prev.map((e) => (e.id === id ? { ...e, isShared: shared } : e)));
  }, [update]);

  const clearHistory = useCallback(() => update(() => []), [update]);

  return { history, addEntry, setShared, clearHistory };
}
