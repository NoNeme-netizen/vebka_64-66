// Страница регистрации: никнейм, email и пароль.
// После успешной регистрации пользователь сразу входит в аккаунт.

import { Form, Link, useActionData } from "react-router";
import type { Route } from "./+types/signup";
import Button from "~/components/ui/Button";
import { createUserSession, signupUser } from "~/auth.server";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Регистрация — Манчкин-пикер" },
    // личный кабинет и формы авторизации не для поисковой выдачи
    { name: "robots", content: "noindex" },
  ];
}

// выполняется на сервере при отправке формы (method="post")
export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const nickname = String(form.get("nickname") || "").trim();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");

  // простая проверка полей на сервере
  if (nickname.length < 2) return { error: "Никнейм — минимум 2 символа" };
  if (!email.includes("@")) return { error: "Введите корректный email" };
  if (password.length < 6) return { error: "Пароль — минимум 6 символов" };

  // сохраняем аккаунт (ошибка вернётся, если email уже занят)
  const error = signupUser(nickname, email, password);
  if (error) return { error };

  // регистрация прошла — сразу входим и возвращаем на главную
  return createUserSession(email, "/");
}

export default function Signup() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <div className="bg-white border border-line rounded-lg p-8">
        <div className="text-center">
          <span className="inline-grid place-items-center w-11 h-11 rounded-lg bg-accent text-white text-xl font-bold">
            М
          </span>
          <h1 className="text-xl font-bold mt-3">Манчкин-пикер</h1>
          <p className="text-muted text-sm mt-1">
            Аккаунт нужен для коллекции, отзывов и друзей
          </p>
        </div>

        {/* переключатель Вход / Регистрация */}
        <div className="grid grid-cols-2 gap-2 mt-6">
          <Link
            to="/login"
            className="h-10 rounded-md bg-white border border-muted/40 text-muted text-sm grid place-items-center hover:bg-chip"
          >
            Вход
          </Link>
          <span className="h-10 rounded-md bg-soft border border-accent text-accent text-sm font-bold grid place-items-center">
            Регистрация
          </span>
        </div>

        <Form method="post" className="mt-5 space-y-4">
          {actionData?.error && (
            <p className="text-sm font-bold text-[#9C4A4A] text-center">
              {actionData.error}
            </p>
          )}

          <label className="block">
            <span className="text-[10px] font-bold text-muted">НИКНЕЙМ</span>
            <input
              name="nickname"
              required
              minLength={2}
              placeholder="как вас звать в игре"
              className="mt-1 w-full h-11 px-3 rounded-md border border-muted/40 text-sm outline-none focus:border-accent"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-bold text-muted">EMAIL</span>
            <input
              type="email"
              name="email"
              required
              placeholder="введите email"
              className="mt-1 w-full h-11 px-3 rounded-md border border-muted/40 text-sm outline-none focus:border-accent"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-bold text-muted">ПАРОЛЬ</span>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              placeholder="минимум 6 символов"
              className="mt-1 w-full h-11 px-3 rounded-md border border-muted/40 text-sm outline-none focus:border-accent"
            />
          </label>

          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-[#4066b0]" />
            Согласен с правилами сайта
          </label>

          <Button type="submit" className="w-full">
            Создать аккаунт
          </Button>
        </Form>

        <p className="text-center text-xs text-muted mt-5">
          Уже есть аккаунт?{" "}
          <Link to="/login" className="text-accent font-bold">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
