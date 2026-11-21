

import { createClient, type SupabaseClient } from "@supabase/supabase-js";


const SUPABASE_URL = (process.env.SUPABASE_URL ?? "")
  .replace(/\/rest\/v1\/?$/, "")
  .replace(/\/+$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_KEY);

if (supabaseEnabled) {
  console.log("[БД] данные: Supabase (" + SUPABASE_URL + ")");
} else {
  console.log("[БД] данные: локальный резерв app/data (переменные SUPABASE_* не заданы)");
}

let client: SupabaseClient | null = null;

export function getAuthClient(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL!, SUPABASE_KEY!, {
      auth: { persistSession: false },
    });
  }
  return client;
}
