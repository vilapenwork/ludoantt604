// Admin user management: create admin, list admins, remove admin, change password
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const body = await req.json().catch(() => ({}));
    const action = body?.action as string;

    // Bootstrap: allow creating the very first admin if no admins exist yet (no auth required).
    if (action === "bootstrap_create_admin") {
      const { count } = await admin
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");
      if ((count ?? 0) > 0) return json({ error: "Admin đã tồn tại. Hãy đăng nhập để tạo thêm." }, 403);

      const email = String(body.email || "").trim();
      const password = String(body.password || "");
      if (!email || password.length < 6) return json({ error: "Email/mật khẩu không hợp lệ" }, 400);

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createErr || !created.user) return json({ error: createErr?.message || "Không tạo được user" }, 400);

      const { error: roleErr } = await admin
        .from("user_roles")
        .insert({ user_id: created.user.id, role: "admin" });
      if (roleErr) return json({ error: roleErr.message }, 400);

      return json({ ok: true, user_id: created.user.id });
    }

    // All other actions require an authenticated admin caller
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "Thiếu Authorization" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Token không hợp lệ" }, 401);

    const callerId = userData.user.id;
    const { data: isAdminData, error: roleCheckErr } = await admin.rpc("has_role", {
      _user_id: callerId,
      _role: "admin",
    });
    if (roleCheckErr) return json({ error: roleCheckErr.message }, 500);
    if (!isAdminData) return json({ error: "Bạn không có quyền admin" }, 403);

    if (action === "list_admins") {
      const { data: roles, error } = await admin
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      if (error) return json({ error: error.message }, 400);

      const result = [];
      for (const r of roles ?? []) {
        const { data: u } = await admin.auth.admin.getUserById(r.user_id);
        if (u?.user) {
          result.push({
            user_id: u.user.id,
            email: u.user.email,
            created_at: u.user.created_at,
          });
        }
      }
      return json({ admins: result });
    }

    if (action === "create_admin") {
      const email = String(body.email || "").trim();
      const password = String(body.password || "");
      if (!email || password.length < 6) return json({ error: "Email/mật khẩu không hợp lệ" }, 400);

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createErr || !created.user) return json({ error: createErr?.message || "Không tạo được user" }, 400);

      const { error: roleErr } = await admin
        .from("user_roles")
        .insert({ user_id: created.user.id, role: "admin" });
      if (roleErr) return json({ error: roleErr.message }, 400);

      return json({ ok: true, user_id: created.user.id });
    }

    if (action === "remove_admin") {
      const targetId = String(body.user_id || "");
      if (!targetId) return json({ error: "Thiếu user_id" }, 400);
      if (targetId === callerId) return json({ error: "Không thể tự xoá chính mình" }, 400);

      // Ensure at least one admin remains
      const { count } = await admin
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");
      if ((count ?? 0) <= 1) return json({ error: "Phải còn ít nhất 1 admin" }, 400);

      const { error: delRoleErr } = await admin
        .from("user_roles")
        .delete()
        .eq("user_id", targetId)
        .eq("role", "admin");
      if (delRoleErr) return json({ error: delRoleErr.message }, 400);

      // Also delete the auth user
      const { error: delUserErr } = await admin.auth.admin.deleteUser(targetId);
      if (delUserErr) return json({ error: delUserErr.message }, 400);

      return json({ ok: true });
    }

    if (action === "change_password") {
      const newPassword = String(body.new_password || "");
      if (newPassword.length < 6) return json({ error: "Mật khẩu tối thiểu 6 ký tự" }, 400);

      const { error: updErr } = await admin.auth.admin.updateUserById(callerId, {
        password: newPassword,
      });
      if (updErr) return json({ error: updErr.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "Action không hợp lệ" }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Lỗi máy chủ" }, 500);
  }
});
