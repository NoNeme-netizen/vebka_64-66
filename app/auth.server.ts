// Серверная часть авторизации (файл .server — работает только на сервере).
// Аккаунты сохраняются в db/users.json

import { createCookieSessionStorage, redirect } from "react-router";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

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

// ---------- хранилище сессии (cookie) ----------
const storage = createCookieSessionStorage({
  cookie: {
    name: "mp_session",
    httpOnly: true, // cookie недоступна из JS в браузере
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // запомнить на 30 дней
    // подпись cookie; для учебного проекта — константа,
    // в продакшене её берут из переменных окружения
    secrets: ["munchkin-picker-2026"],
  },
});

export interface SessionUser {
  nickname: string;
  email: string;
}

// кто вошёл в текущем браузере (читаем cookie); null — гость
export async function getUser(request: Request): Promise<SessionUser | null> {
  const session = await storage.getSession(request.headers.get("Cookie"));
  const email = session.get("email") as string | undefined;
  if (!email) return null;
  const found = readUsers().find((u) => u.email === email);
  return found ? { nickname: found.nickname, email: found.email } : null;
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
export function signupUser(
  nickname: string,
  email: string,
  password: string,
): string | null {
  const users = readUsers();
  if (users.some((u) => u.email === email)) {
    return "Этот email уже зарегистрирован";
  }
  users.push({
    nickname,
    email,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  });
  writeUsers(users);
  return null;
}

// вход: проверяет пару email + пароль; null — ок, строка — ошибка
export function checkUser(email: string, password: string): string | null {
  const found = readUsers().find((u) => u.email === email);
  if (!found || found.passwordHash !== hashPassword(password)) {
    return "Неверный email или пароль";
  }
  return null;
}
