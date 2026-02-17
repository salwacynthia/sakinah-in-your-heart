import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Heart, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useReflectionHistory } from "@/hooks/use-reflection-history";
import ResultCard from "@/components/ResultCard";
import HadithCard from "@/components/HadithCard";
import LoadingAnimation from "@/components/LoadingAnimation";
import HistoryDrawer from "@/components/HistoryDrawer";

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
  const { history, addEntry, clearHistory } = useReflectionHistory();

  const handleSubmit = async () => {
    if (!query.trim()) return;
    setResult(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("sakinah-guidance", {
        body: { message: query },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const guidanceResult = data as GuidanceResult;
      setResult(guidanceResult);
      addEntry({
        query,
        ayat: guidanceResult.ayat,
        ayatReference: guidanceResult.ayatReference,
        bengaliTranslation: guidanceResult.bengaliTranslation,
        reflection: guidanceResult.reflection,
        hadithBengali: guidanceResult.hadithBengali,
        hadithNarrator: guidanceResult.hadithNarrator,
        hadithSource: guidanceResult.hadithSource,
      });
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
      hadith: "",
      hadithBengali: entry.hadithBengali,
      hadithNarrator: entry.hadithNarrator,
      hadithSource: entry.hadithSource,
    });
    setQuery(entry.query);
  };

  const handleReset = () => {
    setResult(null);
    setQuery("");
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
            Sakinah AI
          </h1>
        </motion.div>
        <HistoryDrawer
          history={history}
          onSelect={handleHistorySelect}
          onClear={clearHistory}
        />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            {!loading && !result && (
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
                  Share your thoughts, and find peace through the Quran & Sunnah.
                </p>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="I feel anxious about the future..."
                  className="w-full min-h-[120px] bg-card border border-border rounded-lg p-4 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none text-sm leading-relaxed transition-shadow"
                />
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubmit}
                  disabled={!query.trim()}
                  className="mt-6 px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm tracking-wide disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 mx-auto transition-colors hover:bg-accent"
                >
                  <Sparkles size={16} />
                  Find Peace
                </motion.button>
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

            {result && !loading && (
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
                  hadithText={result.hadithBengali}
                  hadithSource={result.hadithSource}
                  hadithNarrator={result.hadithNarrator}
                  onReset={handleReset}
                />
                <HadithCard
                  hadithBengali={result.hadithBengali}
                  narrator={result.hadithNarrator}
                  source={result.hadithSource}
                />
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
