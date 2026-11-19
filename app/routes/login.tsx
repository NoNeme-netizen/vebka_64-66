// Страница входа: форма с email и паролем.
// Отправка уходит в action: сервер проверяет пару email+пароль
// по файлу аккаунтов и «входит» — кладёт email в сессию-cookie.

import { Form, Link, useActionData } from "react-router";
import type { Route } from "./+types/login";
import Button from "~/components/ui/Button";
import { checkUser, createUserSession } from "~/auth.server";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Вход — Манчкин-пикер" },
    // личный кабинет и формы авторизации не для поисковой выдачи
    { name: "robots", content: "noindex" },
  ];
}

// выполняется на сервере при отправке формы (method="post")
export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");

  // проверяем данные: вернётся текст ошибки или null
  const error = await checkUser(email, password);
  if (error) return { error };

  // успех: запоминаем пользователя в сессии и возвращаем на главную
  return createUserSession(email, "/");
}

export default function Login() {
  // ошибка, возвращённая action (если вход не удался)
  const actionData = useActionData<typeof action>();

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <div className="card p-8">
        {/* логотип */}
        <div className="text-center">
          <span className="inline-grid place-items-center w-11 h-11 rounded-lg bg-accent border-[2.5px] border-ink -rotate-3 text-xl font-bold shadow-[3px_3px_0_0_#141414]">
            М
          </span>
          <h1 className="text-xl font-bold mt-3">Манчкин-пикер</h1>
          <p className="text-muted text-sm mt-1">
            Войдите, чтобы вести коллекцию и звать друзей
          </p>
        </div>

        {/* переключатель Вход / Регистрация */}
        <div className="grid grid-cols-2 gap-2 mt-6">
          <span className="h-10 rounded-lg bg-accent border-2 border-ink text-ink text-sm font-bold grid place-items-center">
            Вход
          </span>
          <Link
            to="/signup"
            className="h-10 rounded-lg bg-white border-2 border-ink text-muted text-sm font-bold grid place-items-center hover:bg-soft"
          >
            Регистрация
          </Link>
        </div>

        <Form method="post" className="mt-5 space-y-4">
          {actionData?.error && (
            <p className="text-sm font-bold text-[#b85c38] text-center">
              {actionData.error}
            </p>
          )}

          <label className="block">
            <span className="text-[10px] font-bold text-muted">EMAIL</span>
            <input
              type="email"
              name="email"
              required
              placeholder="введите email"
              className="mt-1 w-full h-11 px-3 rounded-lg border-2 border-ink text-sm outline-none focus:border-ink/40"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-bold text-muted">ПАРОЛЬ</span>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              className="mt-1 w-full h-11 px-3 rounded-lg border-2 border-ink text-sm outline-none focus:border-ink/40"
            />
          </label>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-[#ffd23f]" />
              Запомнить меня
            </label>
            <a href="#" className="font-bold underline decoration-2 underline-offset-2">Забыли пароль?</a>
          </div>

          <Button type="submit" className="w-full">
            Войти
          </Button>
        </Form>

        <p className="text-center text-xs text-muted mt-5">
          Нет аккаунта?{" "}
          <Link to="/signup" className="font-bold underline decoration-2 underline-offset-2">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}
