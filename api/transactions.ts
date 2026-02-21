import { createClient } from "@supabase/supabase-js";

export default async function handler(req: Request) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  }

  const supabase = createClient(url, key);

  for (const table of ["Installments", "installments"]) {
    let { data, error } = await supabase.from(table).select("*").order("id", { ascending: false });
    if (error) {
      const fallback = await supabase.from(table).select("*");
      if (!fallback.error) ({ data, error } = fallback);
    }
    if (!error && Array.isArray(data)) {
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }
  }

  return new Response(JSON.stringify([]), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
