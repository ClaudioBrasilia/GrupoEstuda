// Exclusão definitiva da conta do usuário.
//
// Exigido pela Google Play (política de exclusão de dados) e pela App Store
// (diretriz 5.1.1(v)): todo app que permite criar conta precisa oferecer,
// dentro do próprio app, um caminho para apagá-la.
//
// A função é chamada com o JWT do próprio usuário. Ela identifica quem está
// chamando pelo token, apaga os arquivos que pertencem àquela pessoa e então
// remove o usuário de auth.users — as tabelas de domínio saem junto pelos
// ON DELETE CASCADE definidos nas migrações.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Buckets em que os arquivos ficam sob um prefixo com o id do usuário.
// group-files fica fora da lista de propósito: o arquivo pertence ao grupo e
// continua útil para os outros membros depois que a conta some.
const USER_SCOPED_BUCKETS = ["study-activities", "study-materials"];

async function removeUserFiles(
  admin: ReturnType<typeof createClient>,
  userId: string,
) {
  for (const bucket of USER_SCOPED_BUCKETS) {
    const { data: files, error } = await admin.storage
      .from(bucket)
      .list(userId, { limit: 1000 });

    if (error || !files?.length) continue;

    const paths = files.map((file) => `${userId}/${file.name}`);
    await admin.storage.from(bucket).remove(paths);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Método não permitido" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Não autenticado" }, 401);
    }

    // Cliente com o token do chamador: serve só para descobrir quem ele é.
    // O id nunca vem do corpo da requisição, para ninguém apagar conta alheia.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      return json({ error: "Não autenticado" }, 401);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    await removeUserFiles(admin, user.id);

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("Falha ao excluir usuário:", deleteError);
      return json({ error: "Não foi possível excluir a conta." }, 500);
    }

    return json({ success: true });
  } catch (error) {
    console.error("Erro inesperado em delete-account:", error);
    return json({ error: "Não foi possível excluir a conta." }, 500);
  }
});
