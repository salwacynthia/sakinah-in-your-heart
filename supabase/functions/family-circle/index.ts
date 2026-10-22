import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_MEMBERS = 5;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("Not authenticated");

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) throw new Error("Server configuration error");
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    const getMembership = async () => {
      const { data } = await admin
        .from("family_members")
        .select("id, role, family_id")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    };

    const familyStatus = async (membership: { family_id: string; role: string } | null) => {
      if (!membership) {
        return { family: null, role: null, members: [], invitations: [] };
      }
      const [{ data: family }, { data: members }, { data: invitations }] = await Promise.all([
        admin
          .from("families")
          .select("id, name, owner_id, max_members, created_at")
          .eq("id", membership.family_id)
          .single(),
        admin
          .from("family_members")
          .select("*")
          .eq("family_id", membership.family_id)
          .order("joined_at"),
        membership.role === "owner"
          ? admin
              .from("family_invitations")
              .select("*")
              .eq("family_id", membership.family_id)
              .eq("status", "pending")
              .order("created_at")
          : Promise.resolve({ data: [] as never[] }),
      ]);
      return {
        family,
        role: membership.role,
        members: members ?? [],
        invitations: invitations ?? [],
      };
    };

    if (action === "status") {
      return json(await familyStatus(await getMembership()));
    }

    if (action === "create") {
      const existing = await getMembership();
      if (existing) throw new Error("You are already in a family");
      const name = typeof body?.name === "string" ? body.name.trim().slice(0, 60) : "";
      if (!name) throw new Error("Please give your family a name");

      const { data: family, error } = await admin
        .from("families")
        .insert({ owner_id: user.id, name })
        .select("id")
        .single();
      if (error) throw new Error("Could not create family");

      const { error: memberError } = await admin.from("family_members").insert({
        family_id: family.id,
        user_id: user.id,
        email: user.email ?? "",
        role: "owner",
      });
      if (memberError) throw new Error("Could not create family");

      return json(await familyStatus({ family_id: family.id, role: "owner" }));
    }

    if (action === "invite") {
      const membership = await getMembership();
      if (!membership || membership.role !== "owner") {
        throw new Error("Only the family owner can invite");
      }
      const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Please enter a valid email address");
      }
      if (email === (user.email ?? "").toLowerCase()) {
        throw new Error("You are already in your own family");
      }

      const [{ data: members }, { data: pendingInvites }] = await Promise.all([
        admin.from("family_members").select("id, email").eq("family_id", membership.family_id),
        admin
          .from("family_invitations")
          .select("id, invited_email, status, expires_at")
          .eq("family_id", membership.family_id)
          .eq("status", "pending"),
      ]);
      const activeInvites = (pendingInvites ?? []).filter(
        (i: { expires_at: string }) => new Date(i.expires_at) > new Date(),
      );
      if ((members?.length ?? 0) + activeInvites.length >= MAX_MEMBERS) {
        throw new Error(`Your family is full (${MAX_MEMBERS} members max)`);
      }
      if ((members ?? []).some((m: { email: string }) => (m.email ?? "").toLowerCase() === email)) {
        throw new Error("This person is already in your family");
      }

      // Re-issue the invitation if one for this email already exists
      const { data: existingInvite } = await admin
        .from("family_invitations")
        .select("id")
        .eq("family_id", membership.family_id)
        .eq("invited_email", email)
        .maybeSingle();

      if (existingInvite) {
        await admin
          .from("family_invitations")
          .update({
            status: "pending",
            invited_by: user.id,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq("id", existingInvite.id);
      } else {
        await admin.from("family_invitations").insert({
          family_id: membership.family_id,
          invited_email: email,
          invited_by: user.id,
        });
      }
      return json(await familyStatus(membership));
    }

    if (action === "revoke") {
      const membership = await getMembership();
      if (!membership || membership.role !== "owner") {
        throw new Error("Only the family owner can do this");
      }
      const id = typeof body?.invitationId === "string" ? body.invitationId : "";
      await admin
        .from("family_invitations")
        .delete()
        .eq("id", id)
        .eq("family_id", membership.family_id);
      return json(await familyStatus(membership));
    }

    if (action === "remove") {
      const membership = await getMembership();
      if (!membership || membership.role !== "owner") {
        throw new Error("Only the family owner can do this");
      }
      const memberId = typeof body?.memberId === "string" ? body.memberId : "";
      const { data: member } = await admin
        .from("family_members")
        .select("id, role")
        .eq("id", memberId)
        .eq("family_id", membership.family_id)
        .maybeSingle();
      if (!member) throw new Error("Member not found");
      if ((member as { role: string }).role === "owner") {
        throw new Error("The owner cannot be removed");
      }
      await admin.from("family_members").delete().eq("id", memberId);
      return json(await familyStatus(membership));
    }

    if (action === "leave") {
      const membership = await getMembership();
      if (!membership) throw new Error("You are not in a family");
      if (membership.role === "owner") {
        throw new Error("Owners cannot leave — delete the family instead");
      }
      await admin.from("family_members").delete().eq("id", membership.id);
      return json({ family: null, role: null, members: [], invitations: [] });
    }

    if (action === "delete") {
      const membership = await getMembership();
      if (!membership || membership.role !== "owner") {
        throw new Error("Only the family owner can do this");
      }
      await admin.from("families").delete().eq("id", membership.family_id);
      return json({ family: null, role: null, members: [], invitations: [] });
    }

    if (action === "accept") {
      const token = typeof body?.token === "string" ? body.token : "";
      if (!token) throw new Error("Invitation link is invalid");

      const { data: invite } = await admin
        .from("family_invitations")
        .select("*")
        .eq("token", token)
        .maybeSingle();
      if (!invite) throw new Error("This invitation no longer exists");
      const inv = invite as {
        id: string;
        family_id: string;
        invited_email: string;
        status: string;
        expires_at: string;
      };
      if (inv.status !== "pending") throw new Error("This invitation is no longer active");
      if (new Date(inv.expires_at) < new Date()) throw new Error("This invitation has expired");
      if ((user.email ?? "").toLowerCase() !== (inv.invited_email ?? "").toLowerCase()) {
        throw new Error(
          `This invitation was sent to ${inv.invited_email}. Please sign in with that email.`,
        );
      }

      const { data: alreadyMember } = await admin
        .from("family_members")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (alreadyMember) throw new Error("You are already in a family");

      const { count } = await admin
        .from("family_members")
        .select("id", { count: "exact", head: true })
        .eq("family_id", inv.family_id);
      if ((count ?? 0) >= MAX_MEMBERS) throw new Error("This family is already full");

      const { data: family } = await admin
        .from("families")
        .select("name")
        .eq("id", inv.family_id)
        .single();

      await admin.from("family_invitations").update({ status: "accepted" }).eq("id", inv.id);
      await admin.from("family_members").insert({
        family_id: inv.family_id,
        user_id: user.id,
        email: user.email ?? "",
        role: "member",
      });
      return json({ ok: true, familyName: (family as { name: string } | null)?.name ?? "your family" });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("family-circle error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
