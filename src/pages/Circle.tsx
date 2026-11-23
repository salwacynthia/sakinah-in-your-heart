import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Copy, Loader2, LogOut, UserMinus, Users } from "lucide-react";
import { useCircle } from "@/hooks/use-circle";
import { toast } from "@/hooks/use-toast";

export const btn =
  "w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm tracking-wide disabled:opacity-50 transition-all hover:bg-primary/85 flex items-center justify-center gap-2";
export const input =
  "w-full bg-card border border-border rounded-lg py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30";

const Circle = () => {
  const { membership, state, me, loading, create, leave, removeMember } = useCircle();
  const [name, setName] = useState("");
  const [circleName, setCircleName] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setBusy(true);
    try { await fn(); if (ok) toast({ title: ok }); }
    catch (e: any) { toast({ title: e.message || "Something went wrong", variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const link = state?.circle ? `${window.location.origin}/join/${state.circle.code}` : "";

  const copy = async () => {
    const text = `Join our family reflection circle on Sakinah: ${link}`;
    try {
      if (navigator.share) await navigator.share({ title: "Sakinah Family Circle", text, url: link });
      else { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch { /* cancelled */ }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-md mx-auto">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-8">
          <ArrowLeft size={12} /> Back
        </Link>
        <div className="text-center mb-8">
          <Users className="mx-auto mb-3 text-primary" size={28} />
          <h1 className="text-2xl font-light text-foreground">Family Circle</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Share chosen reflections with the people you love. No sign-up needed.
          </p>
        </div>

        {membership && !state && loading && (
          <div className="flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
        )}

        {!membership && (
          <form
            onSubmit={(e: FormEvent) => { e.preventDefault(); run(() => create(name, circleName), "Your circle is ready"); }}
            className="bg-card border border-border rounded-xl p-5 space-y-3"
          >
            <label className="block text-xs text-muted-foreground">Your name</label>
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Salwa" maxLength={40} required />
            <label className="block text-xs text-muted-foreground">Circle name (optional)</label>
            <input className={input} value={circleName} onChange={(e) => setCircleName(e.target.value)} placeholder="Our Family" maxLength={40} />
            <button className={btn} disabled={busy || !name.trim()}>
              {busy && <Loader2 size={14} className="animate-spin" />} Create Family Circle
            </button>
          </form>
        )}

        {state?.circle && (
          <div className="space-y-5">
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-xs text-muted-foreground mb-1">Circle</p>
              <p className="text-lg font-light text-foreground mb-4">{state.circle.name}</p>
              <p className="text-xs text-muted-foreground mb-2">Send this link to your family. Anyone with it can join.</p>
              <div className="flex gap-2">
                <input readOnly value={link} className={`${input} text-xs`} onFocus={(e) => e.target.select()} />
                <button onClick={copy} aria-label="Copy invite link" className="px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/85">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-xs text-muted-foreground mb-3">Members ({state.members.length})</p>
              <ul className="space-y-2">
                {state.members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">
                      {m.name}{m.id === me?.id && <span className="text-muted-foreground"> (you)</span>}
                      {m.is_owner && <span className="text-xs text-primary ml-2">creator</span>}
                    </span>
                    {me?.is_owner && !m.is_owner && (
                      <button
                        onClick={() => window.confirm(`Remove ${m.name}?`) && run(() => removeMember(m.id), "Member removed")}
                        className="text-muted-foreground hover:text-destructive" aria-label={`Remove ${m.name}`}
                      ><UserMinus size={14} /></button>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Your reflections stay private. Tap “Share with family” on any reflection to show it here.
            </p>

            <button
              onClick={() => {
                const msg = me?.is_owner
                  ? "Delete this circle? Everyone will lose the shared reflections."
                  : "Leave this circle?";
                if (window.confirm(msg)) run(leave, me?.is_owner ? "Circle deleted" : "You left the circle");
              }}
              className="text-xs text-destructive/70 hover:text-destructive flex items-center gap-1 mx-auto"
            >
              <LogOut size={12} /> {me?.is_owner ? "Delete circle" : "Leave circle"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Circle;
