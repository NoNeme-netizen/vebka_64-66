// Серверная часть авторизации (файл .server — работает только на сервере).
// Аккаунты хранятся в таблице users базы Supabase; если переменные
// окружения Supabase не заданы — в локальном файле db/users.json
// (создаётся сам при первой регистрации).
// Пароль хранится только в виде хэша SHA-256 с «солью» проекта.
// «Кто вошёл» запоминается в подписанной cookie-сессии.

import { createCookieSessionStorage, redirect } from "react-router";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { supabaseEnabled, getAuthClient } from "~/supabase.server";

// файл аккаунтов (лежит рядом с базой; в репозиторий не попадает)
const USERS_FILE = path.resolve("db/users.json");

interface StoredUser {
  nickname: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

// ---------- хранилище аккаунтов ----------
function readUsers(): StoredUser[] {
  if (!existsSync(USERS_FILE)) return [];
  return JSON.parse(readFileSync(USERS_FILE, "utf-8")) as StoredUser[];
}

function writeUsers(users: StoredUser[]) {
  mkdirSync(path.dirname(USERS_FILE), { recursive: true });
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

// пароль не хранится в открытом виде — только хэш с «солью» проекта
function hashPassword(password: string): string {
  return createHash("sha256")
    .update(`munchkin-picker:${password}`)
    .digest("hex");
}

// ---------- аккаунты в Supabase (таблица users) ----------
async function sbCreateUser(nickname: string, email: string, passwordHash: string) {
  const { error } = await getAuthClient()
    .from("users")
    .insert({ nickname, email, password_hash: passwordHash });
  // уникальный индекс по email даёт код 23505
  if (error?.code === "23505") return "Этот email уже зарегистрирован";
  if (error) return "Не удалось создать аккаунт: " + error.message;
  return null;
}

async function sbCheckUser(email: string, passwordHash: string) {
  const { data, error } = await getAuthClient()
    .from("users")
    .select("email")
    .eq("email", email)
    .eq("password_hash", passwordHash)
    .maybeSingle();
  if (error) return "Ошибка обращения к базе: " + error.message;
  if (!data) return "Неверный email или пароль";
  return null;
}

// ---------- хранилище сессии (cookie) ----------
// секрет подписи cookie берётся из переменной окружения;
// в коде — только запасное значение для локальной разработки
const SESSION_SECRET = process.env.SESSION_SECRET ?? "munchkin-picker-2026";

const storage = createCookieSessionStorage({
  cookie: {
    name: "mp_session",
    httpOnly: true, // cookie недоступна из JS в браузере
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // запомнить на 30 дней
    // подпись cookie; для учебного проекта — константа,
    // в продакшене её берут из переменных окружения
    secrets: [SESSION_SECRET],
  },
});

export interface SessionUser {
  id: number; // id в таблице users (для личных данных: коллекция, друзья)
  nickname: string;
  email: string;
}

// кто вошёл в текущем браузере (читаем cookie); null — гость
export async function getUser(request: Request): Promise<SessionUser | null> {
  const session = await storage.getSession(request.headers.get("Cookie"));
  const email = session.get("email") as string | undefined;
  if (!email) return null;

  // ник и id берём из хранилища аккаунтов (Supabase или локальный файл)
  if (supabaseEnabled) {
    const { data } = await getAuthClient()
      .from("users")
      .select("id, nickname")
      .eq("email", email)
      .maybeSingle();
    return data ? { id: data.id, nickname: data.nickname, email } : null;
  }
  // в резервном файле id нет: личные данные показываем как у демо-пользователя
  const found = readUsers().find((u) => u.email === email);
  return found ? { id: 1, nickname: found.nickname, email: found.email } : null;
}

// «войти»: кладём email в сессию и отдаём ответ с Set-Cookie
export async function createUserSession(email: string, redirectTo: string) {
  const session = await storage.getSession();
  session.set("email", email);
  return redirect(redirectTo, {
    headers: { "Set-Cookie": await storage.commitSession(session) },
  });
}

// «выйти»: уничтожаем сессию
export async function destroyUserSession(request: Request) {
  const session = await storage.getSession(request.headers.get("Cookie"));
  return redirect("/", {
    headers: { "Set-Cookie": await storage.destroySession(session) },
  });
}

// ---------- регистрация и вход ----------
// регистрация: возвращает текст ошибки или null, если всё прошло
export async function signupUser(
  nickname: string,
  email: string,
  password: string,
): Promise<string | null> {
  const passwordHash = hashPassword(password);
  if (supabaseEnabled) {
    try {
      return await sbCreateUser(nickname, email, passwordHash);
    } catch (e) {
      console.warn(`[БД] Supabase: регистрация недоступна (${(e as Error).message}) — запись в локальный файл`);
    }
  }

  // локальный резерв: файл db/users.json
  const users = readUsers();
  if (users.some((u) => u.email === email)) {
    return "Этот email уже зарегистрирован";
  }
  users.push({
    nickname,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  });
  writeUsers(users);
  return null;
}

// вход: проверяет пару email + пароль; null — ок, строка — ошибка
export async function checkUser(email: string, password: string): Promise<string | null> {
  const passwordHash = hashPassword(password);
  if (supabaseEnabled) {
    try {
      return await sbCheckUser(email, passwordHash);
    } catch (e) {
      console.warn(`[БД] Supabase: проверка входа недоступна (${(e as Error).message}) — проверка по локальному файлу`);
    }
  }

  const found = readUsers().find((u) => u.email === email);
  if (!found || found.passwordHash !== passwordHash) {
    return "Неверный email или пароль";
  }
  return null;
}
