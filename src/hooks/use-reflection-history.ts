import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  timestamp: number;
}

const STORAGE_KEY = "sakinah-reflection-history";
const IMPORTED_KEY = "sakinah-reflection-history-imported";

interface LocalEntry {
  id: string;
  query: string;
  ayat: string;
  ayatReference: string;
  bengaliTranslation: string;
  reflection: string;
  hadithBengali: string;
  hadithNarrator: string;
  hadithSource: string;
  timestamp: number;
}

function readLocalEntries(): LocalEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function mapReflection(r: any): HistoryEntry {
  return {
    id: r.id,
    query: r.query,
    ayat: r.ayat,
    ayatReference: r.ayat_reference,
    bengaliTranslation: r.translation,
    reflection: r.reflection,
    hadith: r.hadith,
    hadithBengali: r.hadith_translation,
    hadithNarrator: r.hadith_narrator,
    hadithSource: r.hadith_source,
    asmaulHusnaArabic: r.asmaul_husna_arabic,
    asmaulHusnaBengali: r.asmaul_husna_meaning,
    asmaulHusnaExplanation: r.asmaul_husna_explanation,
    isShared: !!r.is_shared_with_family,
    authorId: r.user_id,
    timestamp: new Date(r.created_at).getTime(),
  };
}

export function useReflectionHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) {
        setLoading(false);
        return;
      }

      // One-time import of legacy localStorage entries into the cloud.
      // Non-destructive: the local copy is kept until the import confirms success.
      if (!localStorage.getItem(IMPORTED_KEY)) {
        const local = readLocalEntries();
        if (local.length > 0) {
          const rows = local.map((e) => ({
            user_id: user.id,
            query: e.query,
            ayat: e.ayat ?? "",
            ayat_reference: e.ayatReference ?? "",
            translation: e.bengaliTranslation ?? "",
            reflection: e.reflection ?? "",
            hadith_translation: e.hadithBengali ?? "",
            hadith_narrator: e.hadithNarrator ?? "",
            hadith_source: e.hadithSource ?? "",
            created_at: new Date(e.timestamp).toISOString(),
          }));
          const { error } = await supabase.from("reflections").insert(rows);
          if (!error) localStorage.setItem(IMPORTED_KEY, "1");
        } else {
          localStorage.setItem(IMPORTED_KEY, "1");
        }
      }

      const { data } = await supabase
        .from("reflections")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (!cancelled && data) {
        setHistory(data.map(mapReflection));
      }
      if (!cancelled) setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const addEntry = useCallback(
    async (
      entry: Omit<HistoryEntry, "id" | "timestamp" | "isShared" | "authorId">,
    ): Promise<string | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("reflections")
        .insert({
          user_id: user.id,
          query: entry.query,
          ayat: entry.ayat,
          ayat_reference: entry.ayatReference,
          translation: entry.bengaliTranslation,
          reflection: entry.reflection,
          hadith: entry.hadith,
          hadith_translation: entry.hadithBengali,
          hadith_narrator: entry.hadithNarrator,
          hadith_source: entry.hadithSource,
          asmaul_husna_arabic: entry.asmaulHusnaArabic,
          asmaul_husna_meaning: entry.asmaulHusnaBengali,
          asmaul_husna_explanation: entry.asmaulHusnaExplanation,
        })
        .select("id, created_at")
        .single();

      if (!error && data) {
        setHistory((prev) => [
          {
            ...entry,
            id: data.id,
            isShared: false,
            authorId: user.id,
            timestamp: new Date(data.created_at).getTime(),
          },
          ...prev,
        ]);
        return data.id;
      }
      return null;
    },
    [],
  );

  const toggleShare = useCallback(async (id: string, shared: boolean): Promise<boolean> => {
    const { error } = await supabase
      .from("reflections")
      .update({ is_shared_with_family: shared })
      .eq("id", id);
    if (error) return false;
    setHistory((prev) => prev.map((e) => (e.id === id ? { ...e, isShared: shared } : e)));
    return true;
  }, []);

  const clearHistory = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("reflections").delete().eq("user_id", user.id);
    if (!error) setHistory([]);
  }, []);

  return { history, loading, addEntry, toggleShare, clearHistory };
}
