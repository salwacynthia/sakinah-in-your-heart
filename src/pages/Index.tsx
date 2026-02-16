import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Heart, Sparkles } from "lucide-react";
import ResultCard from "@/components/ResultCard";
import LoadingAnimation from "@/components/LoadingAnimation";

const MOCK_RESULTS = [
  {
    ayat: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
    reference: "সূরা আর-রা'দ (১৩:২৮)",
    bengaliTranslation:
      "জেনে রাখো, আল্লাহর স্মরণেই অন্তরসমূহ প্রশান্তি লাভ করে।",
    reflection:
      "When the heart feels heavy, it seeks something eternal to hold onto. This verse reminds us that true tranquility doesn't come from the world — it comes from remembering the One who created it. Whatever weighs on your heart today, let His remembrance be your refuge.",
  },
  {
    ayat: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
    reference: "সূরা আশ-শারহ (৯৪:৫)",
    bengaliTranslation: "নিশ্চয়ই কষ্টের সাথে স্বস্তি আছে।",
    reflection:
      "Difficulty is never the end of the story. Allah promises ease alongside hardship — not after, but with it. Even in your darkest moment, light already exists. Trust the process, trust the Creator.",
  },
  {
    ayat: "وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ",
    reference: "সূরা আল-হাদীদ (৫৭:৪)",
    bengaliTranslation: "তিনি তোমাদের সাথে আছেন তোমরা যেখানেই থাকো।",
    reflection:
      "You are never alone. Whether in a crowded room or in the silence of the night, Allah's presence surrounds you. This verse is a gentle embrace for the lonely heart — He sees you, He hears you, He is near.",
  },
];

const Index = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<(typeof MOCK_RESULTS)[0] | null>(null);

  const handleSubmit = () => {
    if (!query.trim()) return;
    setResult(null);
    setLoading(true);
    setTimeout(() => {
      const randomResult =
        MOCK_RESULTS[Math.floor(Math.random() * MOCK_RESULTS.length)];
      setResult(randomResult);
      setLoading(false);
    }, 3000);
  };

  const handleReset = () => {
    setResult(null);
    setQuery("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="pt-8 pb-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center justify-center gap-2"
        >
          <Leaf className="text-primary" size={22} />
          <h1 className="text-xl font-light tracking-widest text-primary uppercase">
            Sakinah AI
          </h1>
        </motion.div>
      </header>

      {/* Main */}
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
                  Share your thoughts, and find peace through the Quran.
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
                  ayat={result.ayat}
                  reference={result.reference}
                  bengaliTranslation={result.bengaliTranslation}
                  reflection={result.reflection}
                  onReset={handleReset}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-muted-foreground text-xs tracking-wide">
        Seek peace. Trust the journey.
      </footer>
    </div>
  );
};

export default Index;
