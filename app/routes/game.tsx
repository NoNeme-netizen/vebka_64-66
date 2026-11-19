// Карточка версии игры: /catalog/:slug
// Страница полностью строится из данных базы (Supabase или локальный резерв).

import { Link, useParams, useLoaderData } from "react-router";
import type { Route } from "./+types/game";
import { loadGames, loadReviewsBySlug, loadCollection } from "~/db.server";
import { boxSizes } from "~/data/games";
import Button from "~/components/ui/Button";

// данные версии, её отзывов и наличия в коллекции приходят из базы
export async function loader({ params }: Route.LoaderArgs) {
  const games = await loadGames();
  const game = games.find((g) => g.slug === params.slug);
  const reviews = game ? (await loadReviewsBySlug())[game.slug] ?? [] : [];
  const collection = await loadCollection();
  return {
    game,
    reviews,
    inCollection: collection.some((c) => c.slug === params.slug),
  };
}

export function meta({ matches }: Route.MetaArgs) {
  // данные loader'а текущего маршрута (React Router передаёт их в matches)
  const data = matches.find((m) => m?.id === "routes/game")?.loaderData as
    | { game: { name: string } | null }
    | undefined;
  const game = data?.game ?? null;
  return [
    { title: `${game ? game.name : "Версия"} — Манчкин-пикер` },
    {
      name: "description",
      content: game
        ? `${game.name} — характеристики, состав коробки и отзывы игроков. Выберите версию для следующей партии.`
        : "Карточка версии «Манчкина» в каталоге Манчкин-пикер.",
    },
  ];
}

export default function GamePage() {
  const { slug } = useParams();
  const { game, reviews, inCollection } = useLoaderData<typeof loader>();

  // если адрес неверный — показываем заглушку
  if (!game) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Версия не найдена</h1>
        <Link to="/catalog" className="font-bold underline decoration-2 underline-offset-2 text-sm mt-3 inline-block">
          ← вернуться в каталог
        </Link>
      </div>
    );
  }

  // характеристики версии (имитация строк таблицы game_versions)
  const params: [string, string][] = [
    ["Игроки", game.players],
    ["Время партии", game.time],
    ["Сложность", game.difficulty],
    ["Возраст", `${game.age}+`],
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* «хлебные крошки» */}
      <p className="text-xs text-muted">
        <Link to="/catalog" className="hover:underline">Каталог</Link>
        {" → "}{game.name}
      </p>

      <div className="flex gap-10 mt-4">
        {/* левая колонка: фото коробки */}
        <div className="w-[440px] shrink-0">
          <div className="card p-6 grid place-items-center overflow-hidden -rotate-2 hover:rotate-0 transition-transform">
            <img
              src={game.photo}
              alt={game.name}
              width={boxSizes[game.slug].w}
              height={boxSizes[game.slug].h}
              className="max-h-72 w-auto max-w-full object-contain"
            />
          </div>

          {/* содержимое коробки */}
          <h2 className="font-bold text-sm mt-5">Что в коробке</h2>
          <ul className="mt-2 space-y-1">
            {game.box.map((b) => (
              <li key={b} className="text-sm text-muted flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-muted" /> {b}
              </li>
            ))}
          </ul>
        </div>

        {/* правая колонка: информация о версии */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{game.name}</h1>

          <div className="flex flex-wrap gap-2 mt-3">
            {game.tags.map((t) => (
              <span key={t} className="chip !text-xs !px-2.5 !py-0.5">
                {t}
              </span>
            ))}
          </div>

          <p className="mt-3">
            <span className="text-gold font-black text-xl">★ {game.rating}</span>
            <span className="text-muted text-sm ml-2">· {game.ratingsCount} оценок</span>
          </p>

          {/* характеристики */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            {params.map(([label, value]) => (
              <div key={label} className="card !shadow-[4px_4px_0_0_#141414] px-4 py-3">
                <p className="text-[11px] text-muted">{label}</p>
                <p className="font-bold text-[15px] mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          <p className="mt-5 leading-relaxed">{game.description}</p>

          {/* действия */}
          <div className="flex items-center gap-3 mt-6">
            <Button>{inCollection ? "В коллекции ✓" : "В коллекцию"}</Button>
            <Link
              to="/friends"
              className="btn-hard bg-white px-5 h-11 text-sm"
            >
              Позвать друзей
            </Link>
            <Link to="/picker" className="text-sm font-bold underline decoration-2 underline-offset-2">
              или крутить Слепой пикер
            </Link>
          </div>

          {/* отзывы */}
          <h2 className="font-bold text-sm mt-10">Отзывы игроков</h2>
          <div className="grid grid-cols-2 gap-4 mt-3">
            {reviews.map((r) => (
              <div key={r.id} className="card !shadow-[4px_4px_0_0_#141414] p-4">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-accent border-2 border-ink text-ink text-xs font-bold grid place-items-center">
                    {r.author[0]}
                  </span>
                  <span className="font-bold text-sm">{r.author}</span>
                  <span className="text-gold text-sm ml-auto">★ {r.score}</span>
                </div>
                <p className="text-sm text-muted mt-2 leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
