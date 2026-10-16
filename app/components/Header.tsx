// Шапка приложения: логотип, основное меню и блок профиля.
// Активный пункт меню подчёркивается (NavLink с функцией className).
// Если пользователь вошёл — вместо «Гость» видны его ник и кнопка «Выйти».

import { NavLink, Link, Form } from "react-router";

const NAV = [
  { to: "/", label: "Главная" },
  { to: "/catalog", label: "Каталог" },
  { to: "/picker", label: "Слепой пикер" },
  { to: "/collection", label: "Коллекция" },
  { to: "/friends", label: "Друзья" },
];

// пользователь приходит из корневого загрузчика (app/root.tsx);
// null — гость
export default function Header({
  user,
}: {
  user?: { nickname: string } | null;
}) {
  return (
    <header className="bg-white border-b border-line sticky top-0 z-10">
      <div className="container mx-auto px-4 h-14 flex items-center gap-8">
        {/* логотип */}
        <Link to="/" className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-md bg-accent text-white font-bold grid place-items-center">
            М
          </span>
          <span className="font-bold text-[15px]">Манчкин-пикер</span>
        </Link>

        {/* главное меню */}
        <nav className="flex items-center gap-6">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `text-[13px] pb-1 border-b-2 ${
                  isActive
                    ? "text-ink font-bold border-accent"
                    : "text-muted border-transparent hover:text-ink"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* профиль: вошедший пользователь или гость */}
        {user ? (
          <div className="ml-auto flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-accent text-white text-xs font-bold grid place-items-center">
              {user.nickname[0]?.toUpperCase()}
            </span>
            <span className="text-[13px] font-bold">{user.nickname}</span>
            <Form method="post" action="/logout">
              <button
                type="submit"
                className="text-[13px] text-muted hover:text-ink cursor-pointer"
              >
                Выйти
              </button>
            </Form>
          </div>
        ) : (
          <div className="ml-auto flex items-center gap-2 text-[13px] text-muted">
            <span>Гость</span>
            <Link
              to="/login"
              className="w-8 h-8 rounded-full border border-muted/40 grid place-items-center hover:bg-soft"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="4.4" r="2.6" fill="#C9C9C2" />
                <path d="M1.8 12.6c.7-2.6 2.8-4 5.2-4s4.5 1.4 5.2 4z" fill="#C9C9C2" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
