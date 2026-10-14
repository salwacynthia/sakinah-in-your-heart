import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, Mail, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const inputCls =
  "w-full bg-card border border-border rounded-lg py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Something went wrong", description: error.message, variant: "destructive" });
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Leaf className="mx-auto mb-3 text-primary" size={32} />
          <h1 className="text-xl font-light tracking-widest text-primary uppercase">Reset password</h1>
          <p className="text-muted-foreground text-sm mt-2">
            {sent ? "Check your inbox for a reset link." : "Enter your email and we'll send you a reset link."}
          </p>
        </div>
        {!sent && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm tracking-wide disabled:opacity-50 transition-all hover:bg-primary/85 hover:scale-[1.02]">
              {loading ? "Please wait..." : "Send reset link"}
            </button>
          </form>
        )}
        <Link to="/auth" className="mt-6 flex items-center justify-center gap-1 text-xs text-primary hover:underline">
          <ArrowLeft size={12} /> Back to sign in
        </Link>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
