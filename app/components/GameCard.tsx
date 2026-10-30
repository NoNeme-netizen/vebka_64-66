// Карточка версии игры: используется на главной и в каталоге.
// Сверху — фото коробки, ниже — название, теги, параметры и рейтинг.

import { Link } from "react-router";
import type { GameVersion } from "~/types";
import { boxSizes } from "~/data/games";

export default function GameCard({ game }: { game: GameVersion }) {
  return (
    <Link
      to={`/catalog/${game.slug}`}
      className="block bg-white border border-line rounded-lg overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* фото коробки на цветной подложке */}
      <div className="h-44 grid place-items-center p-3 overflow-hidden">
        <img
          src={game.photo}
          alt={game.name}
          width={boxSizes[game.slug].w}
          height={boxSizes[game.slug].h}
          className="max-h-36 w-auto max-w-full object-contain"
        />
      </div>

      <div className="p-4 border-t border-line">
        <h2 className="font-bold text-[15px]">{game.name}</h2>

        {/* теги версии */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {game.tags.map((t) => (
            <span
              key={t}
              className="text-[10.5px] px-2 py-0.5 rounded-full bg-chip text-muted"
            >
              {t}
            </span>
          ))}
        </div>

        <p className="text-xs text-muted mt-2">
          {game.players} · {game.time}
        </p>

        {/* сложность точками + средняя оценка */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-muted">
            сложность: {game.difficulty}
          </span>
          <span className="text-sm font-bold text-gold">
            ★ {game.rating}
          </span>
        </div>
      </div>
    </Link>
  );
}
