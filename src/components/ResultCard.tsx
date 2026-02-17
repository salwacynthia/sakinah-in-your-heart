import { motion } from "framer-motion";
import { BookOpen, RotateCcw, Share2, Check, Play, Pause, Loader2 } from "lucide-react";
import { useState, useRef, useCallback } from "react";

interface ResultCardProps {
  ayat: string;
  reference: string;
  bengaliTranslation: string;
  reflection: string;
  hadithText?: string;
  hadithSource?: string;
  hadithNarrator?: string;
  onReset: () => void;
}

const ResultCard = ({
  ayat,
  reference,
  bengaliTranslation,
  reflection,
  hadithText,
  hadithSource,
  hadithNarrator,
  onReset,
}: ResultCardProps) => {
  const [copied, setCopied] = useState(false);
  const [audioState, setAudioState] = useState<"idle" | "loading" | "playing">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const extractAyahKey = (ref: string): string | null => {
    const match = ref.match(/(\d+)\s*[:\s।]\s*(\d+)/);
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

  const handleShare = async () => {
    const lines = [
      `📖 ${reference}`,
      `"${ayat}"`,
      "",
      `🇧🇩 ${bengaliTranslation}`,
      "",
      `✦ ${reflection}`,
    ];
    if (hadithText) {
      lines.push("", `🕌 Hadith (${hadithSource || "Sahih"})`, hadithText, `— ${hadithNarrator || ""}`);
    }
    lines.push("", "— Sakinah AI");

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

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
        className="mb-8"
      >
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
          ✦ Reflection
        </h3>
        <p className="text-reflection text-sm leading-relaxed italic">
          {reflection}
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="flex items-center justify-center gap-4"
      >
        <button
          onClick={onReset}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
        >
          <RotateCcw size={12} />
          Ask again
        </button>
        <span className="text-border">·</span>
        <button
          onClick={handleShare}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
        >
          {copied ? <Check size={12} className="text-primary" /> : <Share2 size={12} />}
          {copied ? "Copied!" : "Share"}
        </button>
      </motion.div>
    </div>
  );
};

export default ResultCard;
