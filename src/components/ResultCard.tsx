import { motion } from "framer-motion";
import { BookOpen, RotateCcw } from "lucide-react";

interface ResultCardProps {
  ayat: string;
  reference: string;
  bengaliTranslation: string;
  reflection: string;
  onReset: () => void;
}

const ResultCard = ({
  ayat,
  reference,
  bengaliTranslation,
  reflection,
  onReset,
}: ResultCardProps) => {
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
        <p className="text-xs text-muted-foreground mt-2">{reference}</p>
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

      {/* Reset */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="text-center"
      >
        <button
          onClick={onReset}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 mx-auto"
        >
          <RotateCcw size={12} />
          Ask again
        </button>
      </motion.div>
    </div>
  );
};

export default ResultCard;
