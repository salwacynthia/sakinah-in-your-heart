import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Leaf, Users, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const Invite = () => {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<"idle" | "busy" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  const accept = async () => {
    setState("busy");
    try {
      const { data, error } = await supabase.functions.invoke("family-circle", {
        body: { action: "accept", token },
      });
      if (error) throw new Error("Could not reach the server. Please try again.");
      if (data?.error) throw new Error(data.error);
      setState("ok");
      setMessage(`Welcome to ${data?.familyName ?? "your family"}! Shared reflections will appear in your Family Circle.`);
    } catch (e: unknown) {
      setState("error");
      setMessage(e instanceof Error ? e.message : "This invitation could not be accepted.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm text-center space-y-6"
      >
        <div className="flex items-center justify-center gap-2">
          <Leaf className="text-primary" size={22} />
          <h1 className="text-xl font-light tracking-widest text-primary uppercase">SAKINAH</h1>
        </div>

        {authLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !user ? (
          <div className="bg-card border border-border rounded-xl p-6 space-y-3">
            <Users className="mx-auto text-primary" size={24} />
            <p className="text-sm text-foreground">You've been invited to a family circle.</p>
            <p className="text-xs text-muted-foreground">
              Please sign in first with the email the invitation was sent to, then open the invite link again.
            </p>
            <Link
              to="/auth"
              className="inline-block w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/85 transition-colors"
            >
              Sign in
            </Link>
          </div>
        ) : state === "ok" ? (
          <div className="bg-card border border-border rounded-xl p-6 space-y-3">
            <CheckCircle2 className="mx-auto text-primary" size={24} />
            <p className="text-sm text-foreground">{message}</p>
            <Link to="/" className="inline-block text-xs text-primary hover:underline">
              Go to your reflections
            </Link>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-6 space-y-3">
            <Users className="mx-auto text-primary" size={24} />
            <p className="text-sm text-foreground">You've been invited to join a family circle.</p>
            {state === "error" && (
              <p className="text-xs text-destructive flex items-center justify-center gap-1">
                <XCircle size={12} /> {message}
              </p>
            )}
            <button
              onClick={accept}
              disabled={state === "busy"}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm disabled:opacity-50 hover:bg-primary/85 transition-colors"
            >
              {state === "busy" ? "Joining…" : "Join family circle"}
            </button>
            <Link to="/" className="inline-block text-xs text-muted-foreground hover:text-foreground">
              Not now
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Invite;
