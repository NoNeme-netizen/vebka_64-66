// Серверная часть авторизации (файл .server — работает только на сервере).
import { createCookieSessionStorage, redirect } from "react-router";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { supabaseEnabled, getAuthClient } from "~/supabase.server";

const USERS_FILE = path.resolve("db/users.json");
interface StoredUser {
  nickname: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}
function readUsers(): StoredUser[] {
  if (!existsSync(USERS_FILE)) return [];
  return JSON.parse(readFileSync(USERS_FILE, "utf-8")) as StoredUser[];
}

function writeUsers(users: StoredUser[]) {
  mkdirSync(path.dirname(USERS_FILE), { recursive: true });
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

function hashPassword(password: string): string {
  return createHash("sha256")
    .update(`munchkin-picker:${password}`)
    .digest("hex");
}

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

const SESSION_SECRET = process.env.SESSION_SECRET ?? "munchkin-picker-2026";

const storage = createCookieSessionStorage({
  cookie: {
    name: "mp_session",
    httpOnly: true, 
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // запомнить на 30 дней
    secrets: [SESSION_SECRET],
  },
});

export interface SessionUser {
  id: number; // id в таблице users
  nickname: string;
  email: string;
}
export async function getUser(request: Request): Promise<SessionUser | null> {
  const session = await storage.getSession(request.headers.get("Cookie"));
  const email = session.get("email") as string | undefined;
  if (!email) return null;

  if (supabaseEnabled) {
    try {
      const { data, error } = await getAuthClient()
        .from("users")
        .select("id, nickname")
        .eq("email", email)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data
        ? { id: data.id, nickname: data.nickname, email }
        : null; // аккаунт удалён из базы — считаем гостем
    } catch (e) {
      console.warn(
        `[БД] Supabase: не удалось прочитать пользователя (${(e as Error).message}) — проверка по локальному файлу`,
      );
    }
  }
  const found = readUsers().find((u) => u.email === email);
  return found ? { id: 1, nickname: found.nickname, email: found.email } : null;
}

export async function createUserSession(email: string, redirectTo: string) {
  const session = await storage.getSession();
  session.set("email", email);
  return redirect(redirectTo, {
    headers: { "Set-Cookie": await storage.commitSession(session) },
  });
}

export async function destroyUserSession(request: Request) {
  const session = await storage.getSession(request.headers.get("Cookie"));
  return redirect("/", {
    headers: { "Set-Cookie": await storage.destroySession(session) },
  });
}

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
