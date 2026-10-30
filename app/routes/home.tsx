// Главная страница: краткое представление сервиса и популярные версии.

import { Link } from "react-router";
import type { Route } from "./+types/home";
import { games } from "~/data/games";
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

export default function Home() {
  // три самые популярные версии (по рейтингу)
  const popular = [...games].sort((a, b) => +b.rating - +a.rating).slice(0, 3);

  return (
    <div className="container mx-auto px-4 py-12">
      {/* приветственный блок */}
      <h1 className="text-4xl font-bold">Во что играем сегодня?</h1>
      <p className="text-muted mt-3 max-w-xl">
        Поможем выбрать версию «Манчкина» под вашу компанию за минуту — без
        споров и долгих поисков в интернете.
      </p>

      <div className="flex gap-3 mt-6">
        <Link
          to="/picker"
          className="px-6 h-11 rounded-md bg-accent text-white text-sm font-bold grid place-items-center hover:bg-accent/90"
        >
          Слепой пикер
        </Link>
        <Link
          to="/catalog"
          className="px-6 h-11 rounded-md bg-white border border-muted/50 text-sm grid place-items-center hover:bg-soft"
        >
          Открыть каталог
        </Link>
      </div>

      {/* популярные версии */}
      <div className="flex items-end justify-between mt-12 mb-5">
        <h2 className="text-xl font-bold">Популярное у компаний</h2>
        <Link to="/catalog" className="text-sm text-accent">
          смотреть весь каталог →
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-7">
        {popular.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </div>
    </div>
  );
}
