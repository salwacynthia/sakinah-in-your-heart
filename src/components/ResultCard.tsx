import { motion } from "framer-motion";
import { BookOpen, Play, Pause, Loader2 } from "lucide-react";
import { useState, useRef, useCallback } from "react";

interface ResultCardProps {
  asmaulHusnaArabic?: string;
  asmaulHusnaBengali?: string;
  asmaulHusnaExplanation?: string;
  ayat: string;
  reference: string;
  bengaliTranslation: string;
  reflection: string;
  onReset: () => void;
}

const ResultCard = ({
  asmaulHusnaArabic,
  asmaulHusnaBengali,
  asmaulHusnaExplanation,
  ayat,
  reference,
  bengaliTranslation,
  reflection,
  onReset,
}: ResultCardProps) => {
  const [audioState, setAudioState] = useState<"idle" | "loading" | "playing">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const extractAyahKey = (ref: string): string | null => {
    const toBengali = (s: string) =>
      s.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));
    const ascii = toBengali(ref);
    const match = ascii.match(/(\d+)\s*[:\s।]\s*(\d+)/);
    if (match) return `${match[1]}:${match[2]}`;
    return null;
  };

  const handlePlayAudio = useCallback(async () => {
    if (audioState === "playing") {
      audioRef.current?.pause();
      setAudioState("idle");
      return;
    }

    const ayahKey = extractAyahKey(reference);
    if (!ayahKey) return;

    setAudioState("loading");
    try {
      const res = await fetch(`https://api.quran.com/api/v4/recitations/7/by_ayah/${ayahKey}`);
      const data = await res.json();
      const url = data?.audio_files?.[0]?.url;
      if (!url) throw new Error("No audio");

      const fullUrl = url.startsWith("http") ? url : `https://verses.quran.com/${url}`;
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(fullUrl);
      audioRef.current = audio;
      audio.onended = () => setAudioState("idle");
      audio.onerror = () => setAudioState("idle");
      await audio.play();
      setAudioState("playing");
    } catch {
      setAudioState("idle");
    }
  }, [audioState, reference]);

  return (
    <div className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
      {/* Arabic Ayat */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="text-center mb-6"
      >
        <p className="font-amiri text-2xl sm:text-3xl leading-loose text-ayat" dir="rtl">
          {ayat}
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <p className="text-xs text-muted-foreground">{reference}</p>
          <button
            onClick={handlePlayAudio}
            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
            aria-label={audioState === "playing" ? "Pause recitation" : "Play recitation"}
          >
            {audioState === "loading" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : audioState === "playing" ? (
              <Pause size={14} />
            ) : (
              <Play size={14} className="ml-0.5" />
            )}
          </button>
        </div>
      </motion.div>

      {/* Divider */}
      <div className="w-12 h-px bg-border mx-auto my-6" />

      {/* Bengali Translation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="mb-6"
      >
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
          <BookOpen size={12} />
          Bengali Translation
        </h3>
        <p className="text-foreground text-sm leading-relaxed">
          {bengaliTranslation}
        </p>
      </motion.div>

      {/* Reflection */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="mb-6"
      >
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
          ✦ Reflection
        </h3>
        <p className="text-reflection text-sm leading-relaxed italic">
          {reflection}
        </p>
      </motion.div>

      {/* Healing Name of Allah */}
      {asmaulHusnaArabic && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="text-center bg-primary/5 border border-primary/15 rounded-lg p-5"
        >
          <p className="text-xs uppercase tracking-widest text-primary mb-3 flex items-center justify-center gap-1.5">
            ✦ Healing Name of Allah
          </p>
          <p className="font-amiri text-3xl sm:text-4xl text-primary mb-2" dir="rtl">
            {asmaulHusnaArabic}
          </p>
          <p className="text-sm font-medium text-foreground mb-1">
            {asmaulHusnaBengali}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed italic">
            {asmaulHusnaExplanation}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default ResultCard;
