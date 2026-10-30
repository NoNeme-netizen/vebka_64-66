// Коллекция пользователя: какие версии есть, какие у друзей,
// заметки о состоянии коробок и личные оценки.

import { Link } from "react-router";
import type { Route } from "./+types/collection";
import { games } from "~/data/games";
import { collection } from "~/data/people";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Моя коллекция — Манчкин-пикер" },
    // личный кабинет и формы авторизации не для поисковой выдачи
    { name: "robots", content: "noindex" },
  ];
}

export default function Collection() {
  // находим полную информацию о версии по slug
  const rows = collection.map((c) => ({
    ...c,
    game: games.find((g) => g.slug === c.slug)!,
  }));

  const have = rows.filter((r) => r.ok).length;
  const percent = Math.round((rows.length / games.length) * 100);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Моя коллекция</h1>
          <p className="text-muted text-sm mt-1">
            Отмечайте версии, которые есть у вас, — и не ройтесь в коробках перед игрой.
          </p>
        </div>
        <Link
          to="/catalog"
          className="px-5 h-10 rounded-md bg-accent text-white text-sm font-bold grid place-items-center hover:bg-accent/90"
        >
          Добавить версию
        </Link>
      </div>

      {/* таблица коллекции */}
      <div className="bg-white border border-line rounded-lg mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#fafaf8] text-[10px] text-muted text-left">
              <th className="px-6 py-3 font-bold">ВЕРСИЯ</th>
              <th className="px-4 py-3 font-bold w-32">СТАТУС</th>
              <th className="px-4 py-3 font-bold">ЗАМЕТКА О КОРОБКЕ</th>
              <th className="px-4 py-3 font-bold w-24 text-right">ОЦЕНКА</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.slug} className="border-t border-[#eeeeea]">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={r.game.photo} alt={`Коробка: ${r.game.name}`} className="w-11 h-9 object-contain" />
                    <div>
                      <Link to={`/catalog/${r.slug}`} className="font-bold hover:text-accent">
                        {r.game.name}
                      </Link>
                      <p className="text-xs text-muted">{r.game.theme}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      r.ok ? "bg-[#e7efe4] text-[#4e6b43]" : "bg-chip text-muted"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-muted">{r.note}</td>
                <td className="px-4 py-4 text-right text-gold">★ {r.rating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* прогресс сбора версий */}
      <div className="bg-white border border-line rounded-lg p-5 mt-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold">В коллекции {have} из {games.length} версий</span>
          <span className="text-muted">{percent}%</span>
        </div>
        <div className="h-1.5 rounded bg-[#e3e3dd] mt-3">
          <div className="h-full rounded bg-accent" style={{ width: `${percent}%` }} />
        </div>
        <p className="text-xs text-muted mt-2">
          Ещё {games.length - have} {games.length - have === 1 ? "версия" : "версии"} — у друзей или в магазине.
        </p>
      </div>
    </div>
  );
}
