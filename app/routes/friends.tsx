// Страница «Друзья»: список друзей, заявки и приглашение по ссылке.
// Статус «приглашение отправлено» хранится в состоянии компонента.

import { useState } from "react";
import type { Route } from "./+types/friends";
import { friends as initialFriends } from "~/data/people";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Друзья — Манчкин-пикер" },
    {
      name: "description",
      content:
        "Пригласите друзей и соберите компанию для следующей партии «Манчкина».",
    },
  ];
}

export default function Friends() {
  // копия списка в состоянии, чтобы отмечать отправленные приглашения
  const [list, setList] = useState(initialFriends);
  const [invited, setInvited] = useState<number[]>([]);

  // отправить приглашение другу (имитация записи в game_invitations)
  const invite = (id: number) => setInvited((prev) => [...prev, id]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Друзья</h1>
          <p className="text-muted text-sm mt-1">
            Позовите компанию — вместе и веселее, и спорить есть с кем.
          </p>
        </div>
        <button className="px-4 h-10 rounded-md bg-accent text-white text-xs font-bold hover:bg-accent/90">
          + Добавить друга
        </button>
      </div>

      <div className="flex gap-6 mt-6">
        {/* список друзей */}
        <section className="flex-1 bg-white border border-line rounded-lg p-5">
          <p className="text-[10px] font-bold text-muted">МОИ ДРУЗЬЯ · {list.length}</p>
          <ul>
            {list.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 py-3.5 border-b border-[#eeeeea] last:border-0"
              >
                {/* аватарка с инициалами */}
                <span
                  className="w-11 h-11 rounded-full text-white text-xs font-bold grid place-items-center"
                  style={{ backgroundColor: f.color }}
                >
                  {f.initials}
                </span>
                <div className="flex-1">
                  <p className="font-bold text-sm">{f.name}</p>
                  <p className="text-xs text-muted">{f.status}</p>
                </div>
                {invited.includes(f.id) ? (
                  <span className="text-xs text-[#4e6b43] font-bold px-3">
                    Приглашение отправлено ✓
                  </span>
                ) : f.canInvite ? (
                  <button
                    onClick={() => invite(f.id)}
                    className="px-4 h-9 rounded-md bg-accent text-white text-xs font-bold hover:bg-accent/90"
                  >
                    Позвать играть
                  </button>
                ) : (
                  <span className="text-xs text-muted px-3">недоступен</span>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* правая колонка: заявки и приглашение по ссылке */}
        <aside className="w-80 shrink-0 space-y-5">
          <div className="bg-white border border-line rounded-lg p-5">
            <p className="text-[10px] font-bold text-muted">ЗАЯВКИ В ДРУЗЬЯ · 1</p>
            <div className="flex items-center gap-3 mt-3">
              <span className="w-10 h-10 rounded-full bg-[#8C6A8C] text-white text-[11px] font-bold grid place-items-center">
                РШ
              </span>
              <div className="flex-1">
                <p className="font-bold text-sm">Рома Ш.</p>
                <p className="text-xs text-muted">3 общих друга</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button className="px-4 h-8 rounded-md bg-accent text-white text-xs font-bold hover:bg-accent/90">
                Принять
              </button>
              <button className="px-4 h-8 rounded-md bg-white border border-muted/40 text-xs hover:bg-chip">
                Скрыть
              </button>
            </div>
          </div>

          <div className="bg-white border border-line rounded-lg p-5">
            <h2 className="font-bold text-sm">Пригласить по ссылке</h2>
            <div className="flex gap-2 mt-3">
              <span className="flex-1 h-10 rounded-md bg-chip px-3 text-xs leading-10 truncate">
                munchkin-picker.ru/inv/8F3K2
              </span>
              <button
                className="px-4 h-10 rounded-md bg-accent text-white text-xs font-bold hover:bg-accent/90"
                onClick={() => navigator.clipboard?.writeText("munchkin-picker.ru/inv/8F3K2")}
              >
                Скопировать
              </button>
            </div>
            <p className="text-[11px] text-muted mt-2">
              Ссылку можно отправить другу в мессенджере — аккаунт создастся сразу.
            </p>
          </div>

          <div className="bg-white border border-line rounded-lg p-5">
            <h2 className="font-bold text-sm">Как это работает</h2>
            <ol className="mt-3 space-y-2 text-sm text-muted list-none">
              {[
                "Нажмите «Позвать играть» у друга",
                "Друг примет приглашение",
                "Выберите версию и начинайте партию",
              ].map((s, i) => (
                <li key={s} className="flex items-center gap-2.5">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-soft text-accent text-xs font-bold grid place-items-center">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
