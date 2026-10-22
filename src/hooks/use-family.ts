import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { HistoryEntry, mapReflection } from "@/hooks/use-reflection-history";

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  email: string;
  role: string;
  joined_at: string;
}

export interface FamilyInvitation {
  id: string;
  invited_email: string;
  token: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export interface FamilyStatus {
  family: {
    id: string;
    name: string;
    owner_id: string;
    max_members: number;
    created_at: string;
  } | null;
  role: string | null;
  members: FamilyMember[];
  invitations: FamilyInvitation[];
}

export function useFamily() {
  const [status, setStatus] = useState<FamilyStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("family-circle", {
        body: { action: "status" },
      });
      if (!error && data && !data.error) setStatus(data as FamilyStatus);
    } catch {
      // not signed in or offline — leave status null
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const call = useCallback(
    async (body: Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke("family-circle", { body });
      if (error) {
        let msg = error.message;
        try {
          const ctx = await (error as unknown as { context?: { text?: () => Promise<string> } })
            .context?.text?.();
          const parsed = ctx ? JSON.parse(ctx) : null;
          if (parsed?.error) msg = parsed.error;
        } catch {
          // keep default message
        }
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      await reload();
      return data;
    },
    [reload],
  );

  return { status, loading, call, reload };
}

/** Shared-with-family reflections the signed-in user can see (own + family members'). */
export function useFamilyDiary() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("reflections")
      .select("*")
      .eq("is_shared_with_family", true)
      .order("created_at", { ascending: false })
      .limit(200);
    if (data) setEntries(data.map(mapReflection));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { entries, loading, refresh };
}
