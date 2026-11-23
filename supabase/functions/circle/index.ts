import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const randomToken = (bytes: number) =>
  Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, "0")).join("");

const cleanName = (v: unknown, max = 40) => (typeof v === "string" ? v.trim().slice(0, max) : "");

async function authMember(body: any) {
  const memberId = typeof body?.memberId === "string" ? body.memberId : "";
  const memberKey = typeof body?.memberKey === "string" ? body.memberKey : "";
  if (!memberId || !memberKey) return null;
  const { data } = await admin.from("circle_members").select("id, circle_id, name, is_owner, member_key").eq("id", memberId).maybeSingle();
  if (!data || data.member_key !== memberKey) return null;
  return data;
}

async function circleState(circleId: string) {
  const [{ data: circle }, { data: members }, { data: refl }] = await Promise.all([
    admin.from("circles").select("id, code, name").eq("id", circleId).single(),
    admin.from("circle_members").select("id, name, is_owner, joined_at").eq("circle_id", circleId).order("joined_at"),
    admin.from("circle_reflections").select("id, member_id, local_id, data, created_at").eq("circle_id", circleId).order("created_at", { ascending: false }).limit(200),
  ]);
  return { circle, members: members ?? [], reflections: refl ?? [] };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "create") {
      const name = cleanName(body.name);
      if (!name) return json({ error: "Please enter your name." }, 400);
      const circleName = cleanName(body.circleName) || "Our Family";
      const code = randomToken(8);
      const { data: circle, error } = await admin.from("circles").insert({ code, name: circleName }).select("id").single();
      if (error) throw error;
      const memberKey = randomToken(24);
      const { data: m, error: e2 } = await admin.from("circle_members").insert({ circle_id: circle.id, name, member_key: memberKey, is_owner: true }).select("id").single();
      if (e2) throw e2;
      return json({ memberId: m.id, memberKey, ...(await circleState(circle.id)) });
    }

    if (action === "preview") {
      const code = cleanName(body.code, 64);
      const { data: c } = await admin.from("circles").select("id, name").eq("code", code).maybeSingle();
      if (!c) return json({ error: "This invite link is not valid." }, 404);
      const { count } = await admin.from("circle_members").select("id", { count: "exact", head: true }).eq("circle_id", c.id);
      return json({ name: c.name, memberCount: count ?? 0 });
    }

    if (action === "join") {
      const code = cleanName(body.code, 64);
      const name = cleanName(body.name);
      if (!name) return json({ error: "Please enter your name." }, 400);
      const { data: c } = await admin.from("circles").select("id").eq("code", code).maybeSingle();
      if (!c) return json({ error: "This invite link is not valid." }, 404);
      const { count } = await admin.from("circle_members").select("id", { count: "exact", head: true }).eq("circle_id", c.id);
      if ((count ?? 0) >= 20) return json({ error: "This circle is full." }, 400);
      const memberKey = randomToken(24);
      const { data: m, error } = await admin.from("circle_members").insert({ circle_id: c.id, name, member_key: memberKey }).select("id").single();
      if (error) throw error;
      return json({ memberId: m.id, memberKey, ...(await circleState(c.id)) });
    }

    const me = await authMember(body);
    if (!me) return json({ error: "You are no longer in this circle." }, 401);

    if (action === "state") return json(await circleState(me.circle_id));

    if (action === "share") {
      const localId = cleanName(body.localId, 100);
      const d = body.data;
      if (!localId || !d || typeof d !== "object" || JSON.stringify(d).length > 20000) return json({ error: "Invalid reflection." }, 400);
      const { error } = await admin.from("circle_reflections").upsert({ circle_id: me.circle_id, member_id: me.id, local_id: localId, data: d }, { onConflict: "member_id,local_id" });
      if (error) throw error;
      return json(await circleState(me.circle_id));
    }

    if (action === "unshare") {
      await admin.from("circle_reflections").delete().eq("member_id", me.id).eq("local_id", cleanName(body.localId, 100));
      return json(await circleState(me.circle_id));
    }

    if (action === "remove") {
      if (!me.is_owner) return json({ error: "Only the circle creator can remove members." }, 403);
      await admin.from("circle_members").delete().eq("id", body.targetId).eq("circle_id", me.circle_id).eq("is_owner", false);
      return json(await circleState(me.circle_id));
    }

    if (action === "leave") {
      if (me.is_owner) await admin.from("circles").delete().eq("id", me.circle_id);
      else await admin.from("circle_members").delete().eq("id", me.id);
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("circle error", e);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
