import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Mail, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import FamilySection from "@/components/FamilySection";

const inputCls =
  "w-full bg-card border border-border rounded-lg py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30";
const btnCls =
  "w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm tracking-wide disabled:opacity-50 transition-all hover:bg-primary/85";

const Account = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState<"pw" | "email" | null>(null);

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setBusy("pw");
    // Verify current password first
    const { error: verifyErr } = await supabase.auth.signInWithPassword({ email: user!.email!, password: current });
    if (verifyErr) {
      setBusy(null);
      toast({ title: "Current password is incorrect", variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password, current_password: current } as any);
    setBusy(null);
    if (error) {
      toast({ title: "Couldn't update password", description: error.message, variant: "destructive" });
      return;
    }
    setCurrent(""); setPassword(""); setConfirm("");
    toast({ title: "Password updated" });
  };

  const changeEmail = async (e: FormEvent) => {
    e.preventDefault();
    setBusy("email");
    const { error } = await supabase.auth.updateUser({ email: newEmail }, { emailRedirectTo: `${window.location.origin}/account` });
    setBusy(null);
    if (error) {
      toast({ title: "Couldn't change email", description: error.message, variant: "destructive" });
      return;
    }
    setNewEmail("");
    toast({ title: "Check your inbox", description: "Confirm the change from the link we sent." });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md mx-auto space-y-6">
        <Link to="/" className="flex items-center gap-1 text-xs text-primary hover:underline">
          <ArrowLeft size={12} /> Back
        </Link>
        <h1 className="text-xl font-light tracking-widest text-primary uppercase">Account</h1>

        <section className="bg-card border border-border rounded-xl p-5 flex items-center gap-3">
          <User className="text-primary" size={20} />
          <div>
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="text-sm text-foreground">{user?.email}</p>
          </div>
        </section>

        <FamilySection />

        <section className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-medium text-foreground">Change password</h2>
          <form onSubmit={changePassword} className="space-y-3">
            {[["Current password", current, setCurrent], ["New password", password, setPassword], ["Confirm new password", confirm, setConfirm]].map(([ph, val, set]: any) => (
              <div key={ph} className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input type="password" required minLength={6} placeholder={ph} value={val} onChange={(e) => set(e.target.value)} className={inputCls} />
              </div>
            ))}
            <button type="submit" disabled={busy === "pw"} className={btnCls}>{busy === "pw" ? "Please wait..." : "Update password"}</button>
          </form>
        </section>

        <section className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-medium text-foreground">Change email</h2>
          <form onSubmit={changeEmail} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input type="email" required placeholder="New email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={inputCls} />
            </div>
            <button type="submit" disabled={busy === "email"} className={btnCls}>{busy === "email" ? "Please wait..." : "Update email"}</button>
          </form>
        </section>

        <button onClick={handleSignOut} className="w-full py-3 border border-border rounded-lg text-sm text-foreground flex items-center justify-center gap-2 hover:bg-muted transition-colors">
          <LogOut size={16} /> Sign out
        </button>
      </motion.div>
    </div>
  );
};

export default Account;
