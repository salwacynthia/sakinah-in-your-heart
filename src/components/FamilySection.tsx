import { useState, FormEvent } from "react";
import { Check, Copy, Loader2, Send, Trash2, UserMinus, Users } from "lucide-react";
import { useFamily } from "@/hooks/use-family";
import { toast } from "@/hooks/use-toast";

const btn =
  "w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm tracking-wide disabled:opacity-50 transition-all hover:bg-primary/85 flex items-center justify-center gap-2";
const input =
  "w-full bg-card border border-border rounded-lg py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30";

const FamilySection = () => {
  const { status, loading, call } = useFamily();
  const [familyName, setFamilyName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const run = async (key: string, body: Record<string, unknown>, successMsg?: string) => {
    setBusy(key);
    try {
      await call(body);
      if (successMsg) toast({ title: successMsg });
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast({ title: msg, variant: "destructive" });
      return false;
    } finally {
      setBusy(null);
    }
  };

  const createFamily = async (e: FormEvent) => {
    e.preventDefault();
    if (await run("create", { action: "create", name: familyName }, "Family circle created")) {
      setFamilyName("");
    }
  };

  const invite = async (e: FormEvent) => {
    e.preventDefault();
    if (
      await run("invite", { action: "invite", email: inviteEmail }, "Invitation ready — copy the link and send it")
    ) {
      setInviteEmail("");
    }
  };

  const copyLink = async (id: string, token: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/invite/${token}`);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const removeMember = (memberId: string) => {
    if (window.confirm("Remove this member from your family?")) {
      run(`remove-${memberId}`, { action: "remove", memberId }, "Member removed");
    }
  };

  const leaveFamily = () => {
    if (window.confirm("Leave your family circle?")) {
      run("leave", { action: "leave" }, "You left the family");
    }
  };

  const deleteFamily = () => {
    if (
      window.confirm("Delete your family circle? All members will lose access to shared reflections.")
    ) {
      run("delete", { action: "delete" }, "Family circle deleted");
    }
  };

  const revokeInvite = (invitationId: string) =>
    run(`revoke-${invitationId}`, { action: "revoke", invitationId }, "Invitation revoked");

  if (loading) {
    return (
      <section className="bg-card border border-border rounded-xl p-5">
        <p className="text-xs text-muted-foreground">Loading family…</p>
      </section>
    );
  }

  return (
    <section className="bg-card border border-border rounded-xl p-5 space-y-4">
      <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
        <Users className="text-primary" size={16} /> Family circle
      </h2>

      {!status?.family ? (
        <>
          <p className="text-xs text-muted-foreground">
            Create a private circle for up to 5 people to share chosen reflections with each other.
          </p>
          <form onSubmit={createFamily} className="space-y-3">
            <input
              required
              maxLength={60}
              placeholder="Family name (e.g. The Rahmans)"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className={input}
            />
            <button type="submit" disabled={busy === "create"} className={btn}>
              {busy === "create" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <Users size={14} /> Create family circle
                </>
              )}
            </button>
          </form>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground font-light">{status.family.name}</p>
            <p className="text-[10px] text-muted-foreground tracking-wide">
              {status.members.length} / {status.family.max_members} members
            </p>
          </div>

          <ul className="space-y-2">
            {status.members.map((m) => (
              <li key={m.id} className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs text-foreground truncate">{m.email || "Member"}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {m.role === "owner" ? "Owner" : "Member"}
                  </p>
                </div>
                {status.role === "owner" && m.role !== "owner" && (
                  <button
                    onClick={() => removeMember(m.id)}
                    disabled={busy === `remove-${m.id}`}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    title="Remove member"
                  >
                    <UserMinus size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>

          {status.role === "owner" ? (
            <>
              <form onSubmit={invite} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Invite by email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className={input}
                  />
                  <button
                    type="submit"
                    disabled={busy === "invite"}
                    className="shrink-0 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50 hover:bg-primary/85 transition-colors flex items-center gap-1"
                  >
                    {busy === "invite" ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <>
                        <Send size={12} /> Invite
                      </>
                    )}
                  </button>
                </div>
              </form>
              <p className="text-[10px] text-muted-foreground">
                They accept by opening the invite link while signed in with that email.
              </p>

              {status.invitations.length > 0 && (
                <ul className="space-y-2">
                  {status.invitations.map((inv) => (
                    <li key={inv.id} className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-xs text-foreground truncate">{inv.invited_email}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Invitation pending · expires{" "}
                          {new Date(inv.expires_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => copyLink(inv.id, inv.token)}
                          className="text-muted-foreground hover:text-primary transition-colors p-1"
                          title="Copy invite link"
                        >
                          {copiedId === inv.id ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                        </button>
                        <button
                          onClick={() => revokeInvite(inv.id)}
                          disabled={busy === `revoke-${inv.id}`}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          title="Revoke invitation"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="pt-2 border-t border-border">
                <button
                  onClick={deleteFamily}
                  className="w-full py-2 border border-border rounded-lg text-xs text-foreground hover:bg-muted transition-colors"
                >
                  Delete family
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={leaveFamily}
              className="w-full py-2 border border-border rounded-lg text-xs text-foreground hover:bg-muted transition-colors"
            >
              Leave family
            </button>
          )}
        </>
      )}
    </section>
  );
};

export default FamilySection;
