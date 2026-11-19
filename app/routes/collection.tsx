// Коллекция пользователя: какие версии есть, какие у друзей,
// заметки о состоянии коробок и личные оценки.

import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/collection";
import { getUser } from "~/auth.server";
import { loadGames, loadCollection } from "~/db.server";
import PrivateGate from "~/components/PrivateGate";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Моя коллекция — Манчкин-пикер" },
    { name: "robots", content: "noindex" },
  ];
}

// данные страницы зависят от пользователя: гость видит предложение войти,
// вошедший — свою коллекцию из базы (или резерва)
export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  if (!user) return { user: null, rows: [], total: 6 };
  const [games, collection] = await Promise.all([
    loadGames(),
    loadCollection(user.id),
  ]);
  const rows = collection.flatMap((c) => {
    const game = games.find((g) => g.slug === c.slug);
    return game ? [{ ...c, game }] : [];
  });
  return { user, rows, total: games.length };
}

export default function Collection() {
  const { user, rows, total } = useLoaderData<typeof loader>();

  // незарегистрированному чужая коллекция не показывается
  if (!user) return <PrivateGate what="Моя коллекция" />;

  const have = rows.filter((r) => r.ok).length;
  const percent = Math.round((rows.length / total) * 100);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Моя коллекция</h1>
          <p className="text-muted text-sm mt-1">
            Отмечайте версии, которые есть у вас, — и не ройтесь в коробках перед игрой.
          </p>
        </div>
        <Link
          to="/catalog"
          className="btn-hard bg-accent px-5 h-10 text-sm"
        >
          Добавить версию
        </Link>
      </div>

      {/* таблица коллекции */}
      <div className="card mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-soft text-[10px] text-muted text-left">
              <th className="px-6 py-3 font-bold">ВЕРСИЯ</th>
              <th className="px-4 py-3 font-bold w-32">СТАТУС</th>
              <th className="px-4 py-3 font-bold">ЗАМЕТКА О КОРОБКЕ</th>
              <th className="px-4 py-3 font-bold w-24 text-right">ОЦЕНКА</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.slug} className="border-t border-line">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={r.game.photo} alt={`Коробка: ${r.game.name}`} className="w-11 h-9 object-contain" />
                    <div>
                      <Link to={`/catalog/${r.slug}`} className="font-bold hover:underline">
                        {r.game.name}
                      </Link>
                      <p className="text-xs text-muted">{r.game.theme}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full border-2 border-ink font-bold ${
                      r.ok ? "bg-[#e4f3e6] text-[#2c6e38]" : "bg-white text-muted"
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
      <div className="card p-5 mt-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold">В коллекции {have} из {total} версий</span>
          <span className="text-muted">{percent}%</span>
        </div>
        <div className="h-3 rounded-full bg-white border-2 border-ink mt-3">
          <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
        </div>
        <p className="text-xs text-muted mt-2">
          Ещё {total - have} {total - have === 1 ? "версия" : "версии"} — у друзей или в магазине.
        </p>
      </div>
    </div>
  );
}
