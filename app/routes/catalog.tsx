// Каталог версий: фильтры по тематике, сложности и времени партии.
// Фильтрация выполняется на клиенте через хук useState.

import { useState } from "react";
import type { Route } from "./+types/catalog";
import { games } from "~/data/games";
import GameCard from "~/components/GameCard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Каталог версий — Манчкин-пикер" },
    {
      name: "description",
      content:
        "Все версии «Манчкина» в одном каталоге: фильтры по тематике, сложности и времени партии.",
    },
  ];
}

// «60–90 мин» -> средняя длительность в минутах (для сравнения с фильтром)
function minutes(time: string): number {
  const nums = time.match(/\d+/g)?.map(Number) ?? [];
  if (nums.length === 0) return 0;
  return nums.length > 1 ? (nums[0] + nums[1]) / 2 : nums[0];
}


const THEMES = ["фэнтези", "вампиры", "народный юмор", "зомби", "пираты", "постапокалипсис"];
const DIFFS = ["низкая", "средняя", "высокая"] as const;
const TIMES = [
  { label: "до 60 мин", max: 60 },
  { label: "60–90 мин", max: 90 },
  { label: "90+ мин", max: 999 },
];

export default function Catalog() {
  // состояния фильтров
  const [theme, setTheme] = useState<string | null>(null);
  const [diff, setDiff] = useState<string | null>(null);
  const [timeIdx, setTimeIdx] = useState(1);

  // применяем фильтры к списку версий
  const filtered = games.filter((g) => {
    if (theme && g.theme !== theme) return false;
    if (diff && g.difficulty !== diff) return false;
    const mid = minutes(g.time);
    const minMin = timeIdx === 0 ? 0 : timeIdx === 1 ? 60 : 90;
    const maxMin = TIMES[timeIdx].max;
    return mid >= minMin && mid <= maxMin;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Каталог версий</h1>
      <p className="text-muted text-sm mt-1">
        {games.length} версий · все дополнения «Манчкина» в одном месте
      </p>

      <div className="flex gap-8 mt-6">
        {/* панель фильтров */}
        <aside className="w-72 shrink-0 bg-white border border-line rounded-lg p-5 self-start">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Фильтры</h2>
            {/* сброс возвращает все фильтры к «по умолчанию» */}
            <button
              className="text-xs text-accent"
              onClick={() => { setTheme(null); setDiff(null); setTimeIdx(1); }}
            >
              Сбросить
            </button>
          </div>

          <p className="text-[10px] font-bold text-muted mt-4">ТЕМАТИКА</p>
          <div className="mt-2 space-y-1.5">
            {THEMES.map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-[#4066b0]"
                  checked={theme === t}
                  onChange={(e) => setTheme(e.target.checked ? t : null)}
                />
                {t}
              </label>
            ))}
          </div>

          <p className="text-[10px] font-bold text-muted mt-4">СЛОЖНОСТЬ</p>
          <div className="mt-2 space-y-1.5">
            {DIFFS.map((d) => (
              <label key={d} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="diff"
                  className="accent-[#4066b0]"
                  checked={diff === d}
                  onChange={() => setDiff(d)}
                />
                {d}
              </label>
            ))}
          </div>

          <p className="text-[10px] font-bold text-muted mt-4">ВРЕМЯ ПАРТИИ</p>
          <div className="mt-2 space-y-1.5">
            {TIMES.map((t, i) => (
              <label key={t.label} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="time"
                  className="accent-[#4066b0]"
                  checked={timeIdx === i}
                  onChange={() => setTimeIdx(i)}
                />
                {t.label}
              </label>
            ))}
          </div>
        </aside>

        {/* сетка карточек */}
        <div className="flex-1 grid grid-cols-3 gap-6 self-start">
          {filtered.length > 0 ? (
            filtered.map((g) => <GameCard key={g.id} game={g} />)
          ) : (
            <p className="text-muted col-span-3 py-16 text-center">
              Ничего не нашлось — попробуйте смягчить фильтры.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
