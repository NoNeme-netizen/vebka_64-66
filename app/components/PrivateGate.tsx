// Заглушка приватных страниц (коллекция, друзья) для незарегистрированного
// посетителя: вместо чужих данных — предложение войти или создать аккаунт.

import { Link } from "react-router";

export default function PrivateGate({ what }: { what: string }) {
  return (
    <div className="container mx-auto px-4 py-16 max-w-lg">
      <div className="card p-10 text-center">
        <span className="inline-grid place-items-center w-14 h-14 rounded-lg bg-accent border-[2.5px] border-ink -rotate-3 text-2xl font-bold shadow-[3px_3px_0_0_#141414]">
          ?
        </span>
        <h1 className="text-2xl font-black mt-5">{what} — после входа</h1>
        <p className="text-muted mt-2">
          Эти данные хранятся в вашем аккаунте: у каждого пользователя свои
          коллекция и друзья. Войдите или создайте аккаунт — и они появятся.
        </p>
        <div className="flex justify-center gap-3 mt-6">
          <Link to="/login" className="btn-hard bg-accent px-6 h-11 text-sm">
            Войти
          </Link>
          <Link to="/signup" className="btn-hard bg-white px-6 h-11 text-sm">
            Регистрация
          </Link>
        </div>
      </div>
    </div>
  );
}
