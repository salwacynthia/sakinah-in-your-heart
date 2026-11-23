import { useEffect, useState, FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2, Users } from "lucide-react";
import { callCircle, useCircle } from "@/hooks/use-circle";
import { toast } from "@/hooks/use-toast";
import { btn, input } from "./Circle";

const Join = () => {
  const { code = "" } = useParams();
  const navigate = useNavigate();
  const { membership, join } = useCircle();
  const [info, setInfo] = useState<{ name: string; memberCount: number } | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    callCircle({ action: "preview", code }).then(setInfo).catch((e) => setError(e.message));
  }, [code]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try { await join(code, name); toast({ title: "Welcome to the circle" }); navigate("/circle"); }
    catch (err: any) { toast({ title: err.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <Users className="mx-auto mb-3 text-primary" size={28} />
        {error ? (
          <>
            <p className="text-foreground mb-4">{error}</p>
            <Link to="/" className="text-sm text-primary">Go to Sakinah</Link>
          </>
        ) : !info ? (
          <Loader2 className="animate-spin text-primary mx-auto" />
        ) : membership ? (
          <>
            <p className="text-foreground mb-2">You're already in a family circle on this device.</p>
            <p className="text-xs text-muted-foreground mb-4">Leave it first if you want to join “{info.name}”.</p>
            <Link to="/circle" className="text-sm text-primary">Open my circle</Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-light text-foreground mb-1">Join “{info.name}”</h1>
            <p className="text-sm text-muted-foreground mb-6">{info.memberCount} member{info.memberCount === 1 ? "" : "s"} · no sign-up needed</p>
            <form onSubmit={submit} className="space-y-3 text-left">
              <label className="block text-xs text-muted-foreground">What is your name?</label>
              <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mom" maxLength={40} required autoFocus />
              <button className={btn} disabled={busy || !name.trim()}>
                {busy && <Loader2 size={14} className="animate-spin" />} Join Circle
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Join;
