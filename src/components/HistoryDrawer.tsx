import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Trash2 } from "lucide-react";
import { HistoryEntry } from "@/hooks/use-reflection-history";

interface HistoryDrawerProps {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onClear: () => void;
}

const HistoryDrawer = ({ history, onSelect, onClear }: HistoryDrawerProps) => {
  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
      " · " +
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-xs">
          <Clock size={14} />
          History
          {history.length > 0 && (
            <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full">
              {history.length}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-[340px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-sm font-light tracking-widest uppercase text-primary flex items-center gap-2">
            <Clock size={14} />
            Past Reflections
          </SheetTitle>
        </SheetHeader>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
            <p>No reflections yet.</p>
            <p className="text-xs mt-1">Your journey begins with the first question.</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[calc(100vh-140px)] mt-4 pr-2">
              <div className="space-y-3">
                {history.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => onSelect(entry)}
                    className="w-full text-left bg-card border border-border rounded-lg p-3 hover:border-primary/30 transition-colors group"
                  >
                    <p className="text-xs text-muted-foreground mb-1">
                      {formatDate(entry.timestamp)}
                    </p>
                    <p className="text-sm text-foreground font-medium line-clamp-1 mb-1">
                      {entry.query}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {entry.ayatReference} — {entry.reflection.slice(0, 80)}…
                    </p>
                  </button>
                ))}
              </div>
            </ScrollArea>
            <button
              onClick={onClear}
              className="mt-3 text-xs text-destructive/70 hover:text-destructive transition-colors flex items-center gap-1 mx-auto"
            >
              <Trash2 size={12} />
              Clear all
            </button>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default HistoryDrawer;
