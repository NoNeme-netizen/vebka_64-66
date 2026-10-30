// Карточка версии игры: /catalog/:slug
// Показывает фото коробки, характеристики, описание и отзывы.

import { Link, useParams } from "react-router";
import type { Route } from "./+types/game";
import { games, reviewsBySlug, boxSizes } from "~/data/games";
import { collection } from "~/data/people";
import Button from "~/components/ui/Button";

export function meta({ params }: Route.MetaArgs) {
  const game = games.find((g) => g.slug === params.slug);
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
  const game = games.find((g) => g.slug === slug);

  // если адрес неверный — показываем заглушку
  if (!game) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Версия не найдена</h1>
        <Link to="/catalog" className="text-accent text-sm mt-3 inline-block">
          ← вернуться в каталог
        </Link>
      </div>
    );
  }

  const reviews = reviewsBySlug[game.slug] ?? [];

  // характеристики версии (имитация строк таблицы game_versions)
  const params: [string, string][] = [
    ["Игроки", game.players],
    ["Время партии", game.time],
    ["Сложность", game.difficulty],
    ["Возраст", `${game.age}+`],
  ];

  const inCollection = collection.some((c) => c.slug === game.slug);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* «хлебные крошки» */}
      <p className="text-xs text-muted">
        <Link to="/catalog" className="hover:text-accent">Каталог</Link>
        {" → "}{game.name}
      </p>

      <div className="flex gap-10 mt-4">
        {/* левая колонка: фото коробки */}
        <div className="w-[440px] shrink-0">
          <div className="bg-white border border-line rounded-lg p-6 grid place-items-center overflow-hidden">
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
              <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-chip text-muted">
                {t}
              </span>
            ))}
          </div>

          <p className="mt-3">
            <span className="text-gold font-bold text-lg">★ {game.rating}</span>
            <span className="text-muted text-sm ml-2">· {game.ratingsCount} оценок</span>
          </p>

          {/* характеристики */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            {params.map(([label, value]) => (
              <div key={label} className="bg-white border border-line rounded-lg px-4 py-3">
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
              className="px-5 h-11 rounded-md bg-white border border-muted/50 text-sm grid place-items-center hover:bg-soft"
            >
              Позвать друзей
            </Link>
            <Link to="/picker" className="text-sm text-accent">
              или крутить Слепой пикер
            </Link>
          </div>

          {/* отзывы */}
          <h2 className="font-bold text-sm mt-10">Отзывы игроков</h2>
          <div className="grid grid-cols-2 gap-4 mt-3">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white border border-line rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-accent text-white text-xs font-bold grid place-items-center">
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
