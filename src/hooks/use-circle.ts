import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { HistoryEntry } from "./use-reflection-history";

const KEY = "sakinah-circle-membership";

export interface Membership { memberId: string; memberKey: string }
export interface CircleMember { id: string; name: string; is_owner: boolean }
export interface CircleState {
  circle: { id: string; code: string; name: string } | null;
  members: CircleMember[];
  reflections: { id: string; member_id: string; local_id: string; data: any; created_at: string }[];
}

export const readMembership = (): Membership | null => {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
};
const saveMembership = (m: Membership | null) =>
  m ? localStorage.setItem(KEY, JSON.stringify(m)) : localStorage.removeItem(KEY);

export async function callCircle(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("circle", { body });
  if (error) {
    let msg = "Something went wrong. Please try again.";
    try { const j = await (error as any).context?.json?.(); if (j?.error) msg = j.error; } catch { /* ignore */ }
    const err = new Error(msg) as Error & { status?: number };
    err.status = (error as any).context?.status;
    throw err;
  }
  return data;
}

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function useCircle() {
  const [membership, setMembership] = useState<Membership | null>(readMembership);
  const [state, setState] = useState<CircleState | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const l = () => setMembership(readMembership());
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const authed = useCallback(async (body: Record<string, unknown>) => {
    const m = readMembership();
    if (!m) throw new Error("Not in a circle");
    try {
      const data = await callCircle({ ...body, ...m });
      if (data?.circle) setState(data);
      return data;
    } catch (e: any) {
      if (e.status === 401) { saveMembership(null); setState(null); notify(); }
      throw e;
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!readMembership()) { setState(null); return; }
    setLoading(true);
    try { await authed({ action: "state" }); } catch { /* handled */ } finally { setLoading(false); }
  }, [authed]);

  useEffect(() => { refresh(); }, [membership, refresh]);

  const enter = (data: any) => {
    saveMembership({ memberId: data.memberId, memberKey: data.memberKey });
    setState(data);
    notify();
  };

  const create = async (name: string, circleName: string) =>
    enter(await callCircle({ action: "create", name, circleName }));
  const join = async (code: string, name: string) => enter(await callCircle({ action: "join", code, name }));
  const leave = async () => {
    try { await authed({ action: "leave" }); } finally { saveMembership(null); setState(null); notify(); }
  };
  const share = (entry: HistoryEntry) => {
    const { id, isShared, authorId, authorName, ...data } = entry;
    return authed({ action: "share", localId: id, data: { ...data, timestamp: entry.timestamp } });
  };
  const unshare = (localId: string) => authed({ action: "unshare", localId });
  const removeMember = (targetId: string) => authed({ action: "remove", targetId });

  const me = state?.members.find((m) => m.id === membership?.memberId) ?? null;
  const nameOf = (id: string) => state?.members.find((m) => m.id === id)?.name ?? "Family";
  const familyEntries: HistoryEntry[] = (state?.reflections ?? []).map((r) => ({
    ...r.data,
    id: r.id,
    isShared: true,
    authorId: r.member_id,
    authorName: r.member_id === membership?.memberId ? "You" : nameOf(r.member_id),
    timestamp: new Date(r.created_at).getTime(),
  }));

  return { membership, state, me, loading, familyEntries, refresh, create, join, leave, share, unshare, removeMember };
}
