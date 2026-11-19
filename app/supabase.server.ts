// Единый серверный клиент Supabase.
// Ключ service_role — ТОЛЬКО на сервере (файл .server не попадает
// в браузер); передавать его в клиентский код запрещено.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// нормализуем адрес проекта: при копировании из раздела Data API
// в .env мог попасть лишний путь /rest/v1 — клиент дописывает его сам
const SUPABASE_URL = (process.env.SUPABASE_URL ?? "")
  .replace(/\/rest\/v1\/?$/, "")
  .replace(/\/+$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// конфигурация Supabase присутствует в переменных окружения
export const supabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_KEY);

// подсказка в терминале при старте: откуда приложение берёт данные
if (supabaseEnabled) {
  console.log("[БД] данные: Supabase (" + SUPABASE_URL + ")");
} else {
  console.log("[БД] данные: локальный резерв app/data (переменные SUPABASE_* не заданы)");
}

let client: SupabaseClient | null = null;

// ленивое создание клиента (persistSession выключен: на сервере сессии не хранятся)
export function getAuthClient(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL!, SUPABASE_KEY!, {
      auth: { persistSession: false },
    });
  }
  return client;
}
