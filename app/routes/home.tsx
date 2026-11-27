// Главная страница: краткое представление сервиса и популярные версии.

import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/home";
import { loadGames } from "~/db.server";
import GameCard from "~/components/GameCard";

// Заголовок вкладки браузера
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Манчкин-пикер — во что играем сегодня?" },
    {
      name: "description",
      content:
        "Манчкин-пикер помогает выбрать версию «Манчкина» под компанию: каталог с фильтрами, слепой пикер, коллекция и друзья.",
    },
  ];
}

// данные каталога приходят из базы (Supabase или локальный резерв)
export async function loader({}: Route.LoaderArgs) {
  return { games: await loadGames() };
}

export default function Home() {
  const { games } = useLoaderData<typeof loader>();

  // три самые популярные версии (по рейтингу)
  const popular = [...games].sort((a, b) => +b.rating - +a.rating).slice(0, 3);

  return (
    <div className="container mx-auto px-4 py-12">
      {/* приветственный блок */}
      <h1 className="text-5xl font-black tracking-tight">Во что играем сегодня?</h1>
      <p className="text-muted mt-3 max-w-xl">
        Поможем выбрать версию «Манчкина» под вашу компанию за минуту — без
        споров и долгих поисков в интернете.
      </p>

      <div className="flex gap-3 mt-6">
        <Link
          to="/picker"
          className="btn-hard bg-accent px-6 h-12 text-[15px]"
        >
          Слепой пикер
        </Link>
        <Link
          to="/catalog"
          className="btn-hard bg-white px-6 h-12 text-[15px]"
        >
          Открыть каталог
        </Link>
      </div>

      {/* короткая статистика */}
      <div className="grid grid-cols-3 gap-5 mt-10 max-w-2xl">
        {[
          [`${games.length} версий`, "в каталоге"],
          [
            `${games.reduce((s, g) => s + g.ratingsCount, 0)} отзывов`,
            "от игроков",
          ],
          ["~1 минута", "на выбор версии"],
        ].map(([a, b]) => (
          <div key={a} className="card px-5 py-3 !rounded-lg">
            <p className="font-bold text-lg">{a}</p>
            <p className="text-xs text-muted">{b}</p>
          </div>
        ))}
      </div>

      {/* популярные версии */}
      <div className="flex items-end justify-between mt-12 mb-5">
        <h2 className="text-xl font-bold">Популярное у компаний</h2>
        <Link to="/catalog" className="text-sm font-bold underline decoration-2 underline-offset-2">
          смотреть весь каталог →
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-7 tilt">
        {popular.map((g, i) => (
          <GameCard key={g.id} game={g} priority={i === 0} />
        ))}
      </div>
    </div>
  );
}
