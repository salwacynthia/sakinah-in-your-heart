import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Lock, Trash2, Users } from "lucide-react";
import { HistoryEntry } from "@/hooks/use-reflection-history";

interface HistoryDrawerProps {
  history: HistoryEntry[];
  familyEntries: HistoryEntry[];
  memberNames: Record<string, string>;
  onToggleShare: (entry: HistoryEntry) => void;
  onSelect: (entry: HistoryEntry) => void;
  onClear: () => void;
}

const HistoryDrawer = ({
  history,
  familyEntries,
  memberNames,
  onToggleShare,
  onSelect,
  onClear,
}: HistoryDrawerProps) => {
  const [tab, setTab] = useState<"mine" | "family">("mine");

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return (
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
      " · " +
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    );
  };

  const entries = tab === "mine" ? history : familyEntries;

  const renderEntry = (entry: HistoryEntry, showToggle: boolean) => (
    <div
      key={entry.id}
      className="flex items-stretch bg-card border border-border rounded-lg hover:border-primary/30 transition-colors"
    >
      <button onClick={() => onSelect(entry)} className="flex-1 text-left p-3 min-w-0">
        <p className="text-xs text-muted-foreground mb-1">
          {formatDate(entry.timestamp)}
          {tab === "family" && (
            <span className="text-primary/70"> · {memberNames[entry.authorId ?? ""] ?? "Family"}</span>
          )}
        </p>
        <p className="text-sm text-foreground font-medium line-clamp-1 mb-1">{entry.query}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {entry.ayatReference} — {entry.reflection.slice(0, 80)}…
        </p>
      </button>
      {showToggle && (
        <button
          onClick={() => onToggleShare(entry)}
          title={
            entry.isShared
              ? "Visible to your family — tap to keep private"
              : "Private — tap to share with your family"
          }
          className={`px-2.5 border-l border-border transition-colors ${
            entry.isShared ? "text-primary" : "text-muted-foreground hover:text-primary"
          }`}
        >
          {entry.isShared ? <Users size={14} /> : <Lock size={14} />}
        </button>
      )}
    </div>
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-xs">
          <Clock size={14} />
          History
          {history.length + familyEntries.length > 0 && (
            <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full">
              {history.length + familyEntries.length}
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

        <div className="flex gap-1 mt-2 mx-4 bg-muted/50 rounded-lg p-1">
          <button
            onClick={() => setTab("mine")}
            className={`flex-1 py-1.5 rounded-md text-xs transition-colors ${
              tab === "mine" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            My Diary ({history.length})
          </button>
          <button
            onClick={() => setTab("family")}
            className={`flex-1 py-1.5 rounded-md text-xs transition-colors ${
              tab === "family" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Family Circle ({familyEntries.length})
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm px-6 text-center">
            {tab === "mine" ? (
              <>
                <p>No reflections yet.</p>
                <p className="text-xs mt-1">Your journey begins with the first question.</p>
              </>
            ) : (
              <>
                <Users size={20} className="mb-2 text-primary/60" />
                <p>Nothing shared yet.</p>
                <p className="text-xs mt-1">
                  Reflections shared with your family circle appear here. Tap the lock icon on any entry to share it.
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            <ScrollArea className="h-[calc(100vh-190px)] mt-4 pr-2">
              <div className="space-y-3">{entries.map((entry) => renderEntry(entry, tab === "mine"))}</div>
            </ScrollArea>
            {tab === "mine" && (
              <button
                onClick={onClear}
                className="mt-3 text-xs text-destructive/70 hover:text-destructive transition-colors flex items-center gap-1 mx-auto"
              >
                <Trash2 size={12} />
                Clear all
              </button>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default HistoryDrawer;
