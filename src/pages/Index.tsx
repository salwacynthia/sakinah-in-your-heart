import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Heart, Sparkles, RotateCcw, Share2, User as UserIcon, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useReflectionHistory } from "@/hooks/use-reflection-history";
import { useFamily, useFamilyDiary } from "@/hooks/use-family";
import { useAuth } from "@/hooks/use-auth";
import ResultCard from "@/components/ResultCard";
import HadithCard from "@/components/HadithCard";
import LoadingAnimation from "@/components/LoadingAnimation";
import HistoryDrawer from "@/components/HistoryDrawer";
import Paywall from "@/components/Paywall";

interface GuidanceResult {
  asmaulHusnaArabic: string;
  asmaulHusnaBengali: string;
  asmaulHusnaExplanation: string;
  ayat: string;
  ayatReference: string;
  bengaliTranslation: string;
  reflection: string;
  hadith: string;
  hadithBengali: string;
  hadithNarrator: string;
  hadithSource: string;
}

const Index = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GuidanceResult | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const { user } = useAuth();
  const { history, addEntry, toggleShare, clearHistory } = useReflectionHistory();
  const { status: familyStatus } = useFamily();
  const { entries: familyEntries, refresh: refreshFamilyEntries } = useFamilyDiary();
  const [quota, setQuota] = useState<{ remaining: number | null; limit: number; unlimited: boolean } | null>(null);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [entryShared, setEntryShared] = useState(false);
  const [entryIsMine, setEntryIsMine] = useState(true);
  const [sharing, setSharing] = useState(false);

  const memberNames: Record<string, string> = {};
  if (familyStatus?.family) {
    for (const m of familyStatus.members) {
      memberNames[m.user_id] = m.user_id === user?.id ? "You" : m.email || "Family";
    }
  }

  const applyQuota = (d: any) => {
    if (d && typeof d.limit === "number") {
      setQuota({ remaining: d.remaining ?? null, limit: d.limit, unlimited: !!d.unlimited });
    }
  };

  useEffect(() => {
    supabase.functions
      .invoke("sakinah-guidance", { body: { action: "status" } })
      .then(({ data }) => applyQuota(data))
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!query.trim()) return;
    setResult(null);
    setLimitReached(false);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "sakinah-guidance",
        {
          body: { message: query },
        },
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      applyQuota(data);
      if (data?.limitReached) {
        setLimitReached(true);
        setLoading(false);
        return;
      }

      const guidanceResult = data as GuidanceResult;
      setResult(guidanceResult);
      const newId = await addEntry({
        query,
        ayat: guidanceResult.ayat,
        ayatReference: guidanceResult.ayatReference,
        bengaliTranslation: guidanceResult.bengaliTranslation,
        reflection: guidanceResult.reflection,
        hadith: guidanceResult.hadith || "",
        hadithBengali: guidanceResult.hadithBengali,
        hadithNarrator: guidanceResult.hadithNarrator,
        hadithSource: guidanceResult.hadithSource,
        asmaulHusnaArabic: guidanceResult.asmaulHusnaArabic || "",
        asmaulHusnaBengali: guidanceResult.asmaulHusnaBengali || "",
        asmaulHusnaExplanation: guidanceResult.asmaulHusnaExplanation || "",
      });
      if (newId) {
        setEntryId(newId);
        setEntryShared(false);
        setEntryIsMine(true);
      }
    } catch (e: any) {
      console.error("Guidance error:", e);
      toast({
        title: "Something went wrong",
        description: e.message || "Could not fetch guidance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHistorySelect = (entry: any) => {
    setResult({
      asmaulHusnaArabic: entry.asmaulHusnaArabic || "",
      asmaulHusnaBengali: entry.asmaulHusnaBengali || "",
      asmaulHusnaExplanation: entry.asmaulHusnaExplanation || "",
      ayat: entry.ayat,
      ayatReference: entry.ayatReference,
      bengaliTranslation: entry.bengaliTranslation,
      reflection: entry.reflection,
      hadith: entry.hadith || "",
      hadithBengali: entry.hadithBengali,
      hadithNarrator: entry.hadithNarrator,
      hadithSource: entry.hadithSource,
    });
    setQuery(entry.query);
    setLimitReached(false);
    setEntryId(entry.id);
    setEntryShared(entry.isShared);
    setEntryIsMine(!entry.authorId || entry.authorId === user?.id);
  };

  const handleToggleShare = async (id?: string, current?: boolean) => {
    const targetId = id ?? entryId;
    const targetShared = current ?? entryShared;
    if (!targetId) return;
    setSharing(true);
    const ok = await toggleShare(targetId, !targetShared);
    setSharing(false);
    if (ok) {
      if (targetId === entryId) setEntryShared(!targetShared);
      refreshFamilyEntries();
      toast({ title: !targetShared ? "Shared with your family circle" : "Kept private again" });
    } else {
      toast({ title: "Couldn't update sharing", variant: "destructive" });
    }
  };

  const handleReset = () => {
    setResult(null);
    setQuery("");
    setLimitReached(false);
    setEntryId(null);
    setEntryShared(false);
    setEntryIsMine(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="pt-8 pb-4 px-4 flex items-center justify-between max-w-xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-2"
        >
          <Leaf className="text-primary" size={22} />
          <h1 className="text-xl font-light tracking-widest text-primary uppercase">
            SAKINAH
          </h1>
        </motion.div>
        <div className="flex items-center gap-1">
          <HistoryDrawer
            history={history}
            familyEntries={familyEntries}
            memberNames={memberNames}
            onToggleShare={(entry) => handleToggleShare(entry.id, entry.isShared)}
            onSelect={handleHistorySelect}
            onClear={clearHistory}
          />
          <Link to="/account" aria-label="Account" className="p-2 rounded-full text-primary hover:bg-muted transition-colors">
            <UserIcon size={20} />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            {!loading && !result && !limitReached && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <Heart className="mx-auto mb-6 text-glow" size={32} />
                <h2 className="text-2xl sm:text-3xl font-light text-foreground mb-2">
                  What is on your heart today?
                </h2>
                <p className="text-muted-foreground text-sm mb-8">
                  Share your thoughts, and find peace through the Quran &
                  Sunnah.
                </p>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    "What is on your heart? (e.g., 'I feel lonely', 'Career stress is overwhelming me', 'Amar mon valo nei', 'I want to thank Allah for everything')"
                  }
                  className="w-full min-h-[120px] bg-card border border-border rounded-lg p-4 text-foreground placeholder:text-muted-foreground/40 placeholder:italic focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none text-sm leading-relaxed transition-shadow"
                />

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubmit}
                  disabled={!query.trim()}
                  className="mt-6 px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm tracking-wide disabled:cursor-not-allowed gap-2 mx-auto transition-all hover:bg-primary/85 shadow-none flex items-center justify-start"
                >
                  <Sparkles size={16} />
                  Find Peace
                </motion.button>
                {quota && !quota.unlimited && quota.remaining !== null && (
                  <p className="mt-4 text-xs text-muted-foreground tracking-wide">
                    {quota.remaining} of {quota.limit} reflections remaining today
                  </p>
                )}
              </motion.div>
            )}

            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <LoadingAnimation />
              </motion.div>
            )}

            {limitReached && !loading && (
              <motion.div key="paywall">
                <Paywall onClose={handleReset} />
              </motion.div>
            )}

            {result && !loading && !limitReached && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6 }}
              >
                <ResultCard
                  asmaulHusnaArabic={result.asmaulHusnaArabic}
                  asmaulHusnaBengali={result.asmaulHusnaBengali}
                  asmaulHusnaExplanation={result.asmaulHusnaExplanation}
                  ayat={result.ayat}
                  reference={result.ayatReference}
                  bengaliTranslation={result.bengaliTranslation}
                  reflection={result.reflection}
                  onReset={handleReset}
                />

                <HadithCard
                  hadithBengali={result.hadithBengali}
                  narrator={result.hadithNarrator}
                  source={result.hadithSource}
                />

                {/* Actions after Hadith */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  className="flex items-center justify-center gap-4 mt-6"
                >
                  <button
                    onClick={handleReset}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw size={12} />
                    Ask again
                  </button>
                  {familyStatus?.family && entryIsMine && (
                    <>
                      <span className="text-border">·</span>
                      <button
                        onClick={() => handleToggleShare()}
                        disabled={sharing}
                        className={`text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 ${
                          entryShared ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Users size={12} />
                        {entryShared ? "Shared with family" : "Share with family"}
                      </button>
                    </>
                  )}
                  <span className="text-border">·</span>
                  <button
                    onClick={async () => {
                      const lines = [
                        `📖 ${result.ayatReference}`,
                        `"${result.ayat}"`,
                        "",
                        `🇧🇩 ${result.bengaliTranslation}`,
                        "",
                        `✦ ${result.reflection}`,
                      ];

                      if (result.hadithBengali) {
                        lines.push(
                          "",
                          `🕌 Hadith (${result.hadithSource || "Sahih"})`,
                          result.hadithBengali,
                          `— ${result.hadithNarrator || ""}`,
                        );
                      }
                      lines.push("", "— Sakinah AI");
                      try {
                        await navigator.clipboard.writeText(lines.join("\n"));
                      } catch {}
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                  >
                    <Share2 size={12} />
                    Share
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="py-4 text-center text-muted-foreground text-xs tracking-wide">
        Seek peace. Trust the journey.
      </footer>
    </div>
  );
};

export default Index;
