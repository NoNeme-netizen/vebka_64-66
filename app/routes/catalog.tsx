// Каталог версий: фильтры по тематике, сложности и времени партии.
// Фильтрация выполняется на клиенте через хук useState.

import { useState } from "react";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "react-router";
import type { Route } from "./+types/catalog";
import { getUser } from "~/auth.server";
import {
  addToCollection,
  loadCollection,
  loadGames,
  removeFromCollection,
} from "~/db.server";
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

// данные каталога приходят из базы (Supabase или локальный резерв);
// для вошедшего пользователя дополнительно читаем его коллекцию,
// чтобы на карточках отметить уже добавленные версии
export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  const [games, collection] = await Promise.all([
    loadGames(),
    user ? loadCollection(user.id) : Promise.resolve([]),
  ]);
  return {
    games,
    collected: collection.map((c) => c.slug),
    signedIn: Boolean(user),
  };
}

// добавление или удаление версии в коллекцию прямо из каталога
export async function action({ request }: Route.ActionArgs) {
  const user = await getUser(request);
  if (!user) return { ok: false, error: "Сначала войдите в аккаунт", message: null };

  const form = await request.formData();
  const intent = String(form.get("intent") ?? "add");
  const slug = String(form.get("slug") ?? "");

  if (intent === "remove") {
    const error = await removeFromCollection(user.id, slug);
    return error
      ? { ok: false, error, message: null }
      : { ok: true, error: null, message: "Версия удалена из коллекции" };
  }

  const error = await addToCollection(user.id, slug, "есть дома");
  return error
    ? { ok: false, error, message: null }
    : { ok: true, error: null, message: "Версия добавлена в коллекцию ✓" };
}

export default function Catalog() {
  const { games, collected, signedIn } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const navigation = useNavigation();
  const adding = navigation.state === "submitting";

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
      <h1 className="text-4xl font-black tracking-tight">Каталог версий</h1>
      <p className="text-muted text-sm mt-1">
        {games.length} версий · все дополнения «Манчкина» в одном месте
      </p>

      {/* сообщение после добавления или удаления из коллекции */}
      {result && (
        <p
          className={`mt-4 text-sm font-bold ${
            result.ok ? "text-[#4e6b43]" : "text-[#9C4A4A]"
          }`}
        >
          {result.ok ? result.message : result.error}
        </p>
      )}

      <div className="flex gap-8 mt-6">
        {/* панель фильтров */}
        <aside className="card w-72 shrink-0 p-5 self-start">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Фильтры</h2>
            {/* сброс возвращает все фильтры к «по умолчанию» */}
            <button
              className="text-xs font-bold underline decoration-2 underline-offset-2"
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
                  className="accent-[#ffd23f]"
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
                  className="accent-[#ffd23f]"
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
                  className="accent-[#ffd23f]"
                  checked={timeIdx === i}
                  onChange={() => setTimeIdx(i)}
                />
                {t.label}
              </label>
            ))}
          </div>
        </aside>

        {/* сетка карточек */}
        <div className="flex-1 grid grid-cols-3 gap-7 self-start tilt">
          {filtered.length > 0 ? (
            filtered.map((g, i) => (
              <GameCard
                key={g.id}
                game={g}
                priority={i === 0}
                footer={
                  !signedIn ? (
                    <Link
                      to="/login"
                      className="btn-hard bg-white w-full h-9 text-xs"
                    >
                      Войдите, чтобы добавить
                    </Link>
                  ) : collected.includes(g.slug) ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#4e6b43]">
                        В коллекции ✓
                      </span>
                      <Form method="post">
                        <input type="hidden" name="intent" value="remove" />
                        <input type="hidden" name="slug" value={g.slug} />
                        <button
                          type="submit"
                          disabled={adding}
                          className="btn-hard bg-white px-3 h-8 text-xs disabled:opacity-60"
                        >
                          Удалить
                        </button>
                      </Form>
                    </div>
                  ) : (
                    <Form method="post">
                      <input type="hidden" name="intent" value="add" />
                      <input type="hidden" name="slug" value={g.slug} />
                      <button
                        type="submit"
                        disabled={adding}
                        className="btn-hard bg-accent w-full h-9 text-xs disabled:opacity-60"
                      >
                        В коллекцию
                      </button>
                    </Form>
                  )
                }
              />
            ))
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
