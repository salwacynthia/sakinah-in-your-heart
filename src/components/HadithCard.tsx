import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

interface HadithCardProps {
  hadithBengali: string;
  narrator: string;
  source: string;
}

const HadithCard = ({ hadithBengali, narrator, source }: HadithCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.6 }}
      className="bg-sand border border-border rounded-xl p-6 sm:p-8 shadow-sm mt-4"
    >
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-1.5">
        <BookOpen size={12} />
        Prophetic Wisdom — Hadith
      </h3>

      <p className="text-sand-foreground text-sm leading-relaxed mb-4">
        {hadithBengali}
      </p>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="bg-background/60 px-2.5 py-1 rounded-md">
          📖 {source}
        </span>
        <span className="bg-background/60 px-2.5 py-1 rounded-md">
          🕌 {narrator}
        </span>
      </div>
    </motion.div>
  );
};

export default HadithCard;
